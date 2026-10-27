import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { normalizeDoi, fetchJson, calculateEvidenceReadiness, type MetadataRecord } from "@/lib/research-engine";
import { readSessionFromCookie, sessionCookieName } from "@/lib/auth0-native";
import { getMemberByAuth0Sub, saveResearchAuditSnapshot, SupabaseConfigurationError } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Crossref = { message?: Record<string, unknown> };
type DataCite = { data?: { id?: string; attributes?: Record<string, unknown> } };
type OpenAlex = { results?: Array<Record<string, unknown>> };
const cap = (v: unknown) => typeof v === "string" ? v.slice(0, 400) : "";
const list = (v: unknown) => Array.isArray(v) ? v : [];
function authorsFrom(values: unknown, kind: "crossref" | "datacite" | "openalex"): string[] {
  return list(values).slice(0, 12).map((value) => {
    const x = value as Record<string, unknown>;
    if (kind === "crossref") return [cap(x.given), cap(x.family)].filter(Boolean).join(" ");
    if (kind === "datacite") return cap(x.name) || [cap(x.givenName), cap(x.familyName)].filter(Boolean).join(" ");
    return cap((x.author as Record<string, unknown> | undefined)?.display_name);
  }).filter(Boolean);
}
function dateYear(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") { const m = v.match(/\b(19|20|21)\d{2}\b/); return m ? Number(m[0]) : null; }
  return null;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 2000) return NextResponse.json({ error: "La solicitud excede el tamaño permitido." }, { status: 413 });
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch { return NextResponse.json({ error: "Se requiere JSON válido." }, { status: 400 }); }
  const doi = normalizeDoi(typeof body.doi === "string" ? body.doi : "");
  if (!doi) return NextResponse.json({ error: "DOI inválido. Usa un identificador con formato 10.xxxx/..." }, { status: 400 });

  const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
  const dataCiteUrl = `https://api.datacite.org/dois/${encodeURIComponent(doi)}`;
  const openAlexUrl = new URL("https://api.openalex.org/works");
  openAlexUrl.searchParams.set("filter", `doi:https://doi.org/${doi}`);
  openAlexUrl.searchParams.set("per-page", "1");
  const [crossrefResult, dataCiteResult, openAlexResult] = await Promise.all([
    fetchJson<Crossref>(crossrefUrl, { headers: { "user-agent": `TAMV-Research-Audit/1.0 (https://tamv.online; mailto:${process.env.TAMV_CONTACT_EMAIL || "contact@example.invalid"})` } }),
    fetchJson<DataCite>(dataCiteUrl, { headers: { "user-agent": `TAMV-Research-Audit/1.0 (https://tamv.online; mailto:${process.env.TAMV_CONTACT_EMAIL || "contact@example.invalid"})` } }),
    fetchJson<OpenAlex>(openAlexUrl.toString()),
  ]);

  const records: MetadataRecord[] = [];
  if (crossrefResult.ok && crossrefResult.data?.message) {
    const x = crossrefResult.data.message;
    records.push({
      provider: "Crossref", status: "found", url: `https://doi.org/${doi}`, doi,
      title: cap(list(x.title)[0]) || null, authors: authorsFrom(x.author, "crossref"),
      year: dateYear(list((x.published as Record<string, unknown> | undefined)?.["date-parts"]).flat()[0]),
      publisher: cap(x.publisher) || null, resourceType: cap(x.type) || null,
      license: cap(list(x.license)[0] && (list(x.license)[0] as Record<string, unknown>).URL) || null,
      rawStatus: crossrefResult.status,
      note: "Metadatos registrados en Crossref; la existencia no implica arbitraje.",
    });
  } else records.push({ provider: "Crossref", status: crossrefResult.status === 404 ? "not_found" : "unavailable", url: crossrefUrl, doi, title: null, authors: [], year: null, publisher: null, resourceType: null, license: null, rawStatus: crossrefResult.status, note: crossrefResult.error || "Sin registro recuperable." });

  if (dataCiteResult.ok && dataCiteResult.data?.data?.attributes) {
    const x = dataCiteResult.data.data.attributes;
    const rights = list(x.rightsList);
    const creatorValues = list(x.creators);
    const recordDoi = cap(x.doi || dataCiteResult.data.data.id) || doi;
    const types = x.types as Record<string, unknown> | undefined;
    records.push({
      provider: "DataCite", status: "found", url: cap(x.url) || `https://doi.org/${recordDoi}`, doi: recordDoi,
      title: cap((list(x.titles)[0] as Record<string, unknown> | undefined)?.title) || null,
      authors: authorsFrom(creatorValues, "datacite"), year: dateYear(x.publicationYear), publisher: cap(x.publisher) || null,
      resourceType: cap(types?.resourceTypeGeneral) || null,
      license: cap((rights[0] as Record<string, unknown> | undefined)?.rightsUri || (rights[0] as Record<string, unknown> | undefined)?.rights) || null,
      rawStatus: dataCiteResult.status, note: "La API pública DataCite solo devuelve DOI en estado Findable.",
    });
  } else records.push({ provider: "DataCite", status: dataCiteResult.status === 404 ? "not_found" : "unavailable", url: dataCiteUrl, doi, title: null, authors: [], year: null, publisher: null, resourceType: null, license: null, rawStatus: dataCiteResult.status, note: dataCiteResult.error || "Sin registro recuperable." });

  if (openAlexResult.ok && openAlexResult.data) {
    const found = list(openAlexResult.data.results)[0] as Record<string, unknown> | undefined;
    if (found) records.push({
      provider: "OpenAlex", status: "found", url: cap(found.id) || `https://openalex.org/works?search=${encodeURIComponent(doi)}`, doi,
      title: cap(found.title) || null, authors: authorsFrom(found.authorships, "openalex"),
      year: dateYear(found.publication_year), publisher: null, resourceType: cap(found.type) || null, license: null,
      rawStatus: openAlexResult.status, note: "Registro agregado a OpenAlex; puede estar ausente por diferencias de cobertura o tiempos de ingesta."
    });
    else records.push({ provider: "OpenAlex", status: "not_found", url: openAlexUrl.toString(), doi, title: null, authors: [], year: null, publisher: null, resourceType: null, license: null, rawStatus: openAlexResult.status, note: "No encontrado en esta consulta." });
  } else records.push({ provider: "OpenAlex", status: "unavailable", url: openAlexUrl.toString(), doi, title: null, authors: [], year: null, publisher: null, resourceType: null, license: null, rawStatus: openAlexResult.status, note: openAlexResult.error });

  const primary = records.find((x) => x.status === "found" && x.title) || records[0];
  const readiness = calculateEvidenceReadiness({
    title: primary.title, authors: primary.authors, year: primary.year, doi: primary.doi,
    publisher: primary.publisher, url: primary.url, license: primary.license,
    reproducibilityDocumented: false, peerReviewEvidence: false, ipAssessmentDone: false,
  });
  const retrievedAt = new Date().toISOString();
  const canonical = JSON.stringify({ version: "tamv-doi-audit-1.0.0", doi, retrievedAt, records, readiness });
  const auditHash = createHash("sha256").update(canonical).digest("hex");
  let persisted: { saved: boolean; message: string } = { saved: false, message: "Instantánea verificada en esta consulta, no guardada en Supabase." };

  if (body.persist === true) {
    const cookie = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(sessionCookieName() + "="))?.slice(sessionCookieName().length + 1);
    const session = readSessionFromCookie(cookie);
    if (!session) return NextResponse.json({ error: "Inicia sesión y registra tu TAMV ID para guardar una auditoría." }, { status: 401 });
    try {
      const member = await getMemberByAuth0Sub(session.sub);
      if (!member) return NextResponse.json({ error: "Primero debes completar tu registro TAMV ID." }, { status: 403 });
      if (process.env.TAMV_RESEARCH_AUDIT_PERSISTENCE_ENABLED !== "true") {
        return NextResponse.json({ error: "La persistencia está cerrada hasta aplicar la migración de auditorías y habilitar TAMV_RESEARCH_AUDIT_PERSISTENCE_ENABLED." }, { status: 503 });
      }
      await saveResearchAuditSnapshot({
        tamvId: member.tamv_id, auditType: "doi_metadata", subject: doi, auditHash,
        engineVersion: "tamv-doi-audit-1.0.0",
        sourceStatus: records.map((record) => ({ provider: record.provider, status: record.status, rawStatus: record.rawStatus })),
        snapshot: { version: "tamv-doi-audit-1.0.0", doi, retrievedAt, records, readiness },
      });
      persisted = { saved: true, message: "Instantánea guardada en Supabase y vinculada a tu TAMV ID." };
    } catch (error) {
      if (error instanceof SupabaseConfigurationError) return NextResponse.json({ error: "Supabase no está configurado para guardar auditorías." }, { status: 503 });
      console.error("TAMV research audit persistence failed");
      return NextResponse.json({ error: "No se pudo guardar la auditoría. Revisa el estado de la migración y los permisos del servidor." }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true, doi, retrievedAt, auditHash, records, readiness, persistence: persisted,
    sources: {
      crossref: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/",
      datacite: "https://support.datacite.org/docs/rest-api",
      openAlex: "https://help.openalex.org/api/",
    },
    limitation: "Esta revisión coteja metadatos accesibles por API. No verifica revisión por pares, la identidad de los autores, la validez del contenido, la concesión legal de derechos, ni el estado de una patente. Un registro ausente en una fuente no demuestra que la obra no exista.",
  }, { headers: { "cache-control": "no-store" } });
}
