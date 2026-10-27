import { NextResponse } from "next/server";
import { fetchJson, type ProviderState, type ResearchItem, yearFromDate } from "@/lib/research-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpenAlexResponse = { results?: Array<Record<string, unknown>> };
type CrossrefResponse = { message?: { items?: Array<Record<string, unknown>> } };
type DataCiteResponse = { data?: Array<{ id?: string; attributes?: Record<string, unknown> }> };
type RorResponse = { items?: Array<Record<string, unknown>> };

function cap(value: unknown, max = 240): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function arr(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function safeExternalUrl(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  try { const u = new URL(value); return u.protocol === "https:" ? u.toString() : fallback; } catch { return fallback; }
}
const now = () => new Date().toISOString();

function metadataResult(item: Partial<ResearchItem>): ResearchItem | null {
  if (!item.title) return null;
  return {
    id: item.id || item.doi || item.url || crypto.randomUUID(),
    provider: item.provider || "unknown",
    title: cap(item.title, 600),
    url: safeExternalUrl(item.url, item.doi ? `https://doi.org/${item.doi}` : ""),
    doi: item.doi || null,
    year: item.year || null,
    authors: (item.authors || []).slice(0, 12).map((x) => cap(x, 120)),
    venue: item.venue ? cap(item.venue, 240) : null,
    resourceType: item.resourceType ? cap(item.resourceType, 100) : null,
    citedByCount: typeof item.citedByCount === "number" && Number.isFinite(item.citedByCount) ? item.citedByCount : null,
    license: item.license ? cap(item.license, 240) : null,
    openAccess: typeof item.openAccess === "boolean" ? item.openAccess : null,
    evidenceClass: item.evidenceClass || "Registro bibliográfico; el registro no certifica arbitraje ni calidad.",
    retrievedAt: now(),
  };
}

async function searchOpenAlex(q: string): Promise<{ items: ResearchItem[]; state: ProviderState }> {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", q);
  url.searchParams.set("per-page", "8");
  url.searchParams.set("select", "id,doi,title,publication_year,type,authorships,cited_by_count,primary_location,open_access");
  if (process.env.TAMV_CONTACT_EMAIL) url.searchParams.set("mailto", process.env.TAMV_CONTACT_EMAIL);
  const r = await fetchJson<OpenAlexResponse>(url.toString(), { headers: { "user-agent": "TAMV-Research-Audit/1.0 (+https://tamv.online)" } });
  if (!r.ok || !r.data) return { items: [], state: { id: "openalex", name: "OpenAlex", status: "unavailable", count: 0, note: r.error } };
  const items = arr(r.data.results).flatMap((row) => {
    const location = row.primary_location as Record<string, unknown> | null;
    const source = location?.source as Record<string, unknown> | null;
    const access = row.open_access as Record<string, unknown> | null;
    const authors = arr(row.authorships).flatMap((value) => { const author = (value as Record<string, unknown>)?.author as Record<string, unknown> | undefined; const name = cap(author?.display_name, 120); return name ? [name] : []; });
    const doi = cap(row.doi).replace(/^https?:\/\/doi\.org\//i, "") || null;
    const normalized = metadataResult({
      id: cap(row.id), provider: "OpenAlex", title: cap(row.title, 600), url: doi ? `https://doi.org/${doi}` : safeExternalUrl(location?.landing_page_url, cap(row.id)),
      doi, year: yearFromDate(row.publication_year), authors, venue: cap(source?.display_name) || null, resourceType: cap(row.type) || null,
      citedByCount: typeof row.cited_by_count === "number" ? row.cited_by_count : null,
      openAccess: typeof access?.is_oa === "boolean" ? access.is_oa : null,
      evidenceClass: "Metadatos bibliográficos agregados por OpenAlex; no implican revisión por pares.",
    });
    return normalized ? [normalized] : [];
  });
  return { items, state: { id: "openalex", name: "OpenAlex", status: items.length ? "ok" : "empty", count: items.length, note: "API pública; metadatos sujetos a la cobertura y actualización del proveedor." } };
}

async function searchCrossref(q: string): Promise<{ items: ResearchItem[]; state: ProviderState }> {
  const url = new URL("https://api.crossref.org/works");
  url.searchParams.set("query.bibliographic", q);
  url.searchParams.set("rows", "8");
  url.searchParams.set("select", "DOI,title,author,published,publisher,type,URL,container-title,is-referenced-by-count,license");
  if (process.env.TAMV_CONTACT_EMAIL) url.searchParams.set("mailto", process.env.TAMV_CONTACT_EMAIL);
  const r = await fetchJson<CrossrefResponse>(url.toString(), { headers: { "user-agent": `TAMV-Research-Audit/1.0 (https://tamv.online; mailto:${process.env.TAMV_CONTACT_EMAIL || "contact@example.invalid"})` } });
  if (!r.ok || !r.data) return { items: [], state: { id: "crossref", name: "Crossref", status: "unavailable", count: 0, note: r.error } };
  const items = arr(r.data.message?.items).flatMap((row) => {
    const title = cap(arr(row.title)[0], 600);
    const doi = cap(row.DOI) || null;
    const authors = arr(row.author).map((a) => {
      const author = a as Record<string, unknown>;
      return [cap(author.given, 80), cap(author.family, 100)].filter(Boolean).join(" ");
    }).filter(Boolean);
    const dateParts = arr((row.published as Record<string, unknown> | undefined)?.["date-parts"]);
    const year = yearFromDate(arr(dateParts[0])[0]);
    const license = cap(arr(row.license)[0] && (arr(row.license)[0] as Record<string, unknown>).URL);
    const normalized = metadataResult({
      id: `crossref:${doi || title}`, provider: "Crossref", title,
      url: safeExternalUrl(row.URL, doi ? `https://doi.org/${doi}` : ""), doi, year, authors,
      venue: cap(arr(row["container-title"])[0]) || cap(row.publisher) || null,
      resourceType: cap(row.type) || null, citedByCount: typeof row["is-referenced-by-count"] === "number" ? row["is-referenced-by-count"] as number : null,
      license: license || null, evidenceClass: "Registro de metadatos depositados en Crossref; no constituye una evaluación editorial."
    });
    return normalized ? [normalized] : [];
  });
  return { items, state: { id: "crossref", name: "Crossref", status: items.length ? "ok" : "empty", count: items.length, note: "Metadatos DOI aportados por miembros y editores; comprobar el registro primario." } };
}

async function searchDataCite(q: string): Promise<{ items: ResearchItem[]; state: ProviderState }> {
  const url = new URL("https://api.datacite.org/dois");
  url.searchParams.set("query", q);
  url.searchParams.set("page[size]", "8");
  url.searchParams.set("sort", "published");
  const r = await fetchJson<DataCiteResponse>(url.toString(), { headers: { "user-agent": `TAMV-Research-Audit/1.0 (https://tamv.online; mailto:${process.env.TAMV_CONTACT_EMAIL || "contact@example.invalid"})` } });
  if (!r.ok || !r.data) return { items: [], state: { id: "datacite", name: "DataCite", status: "unavailable", count: 0, note: r.error } };
  const items = arr(r.data.data).flatMap((entry) => {
    const row = entry.attributes || {};
    const titles = arr(row.titles);
    const title = cap((titles[0] as Record<string, unknown> | undefined)?.title, 600);
    const doi = cap(row.doi || entry.id) || null;
    const authors = arr(row.creators).map((v) => {
      const x = v as Record<string, unknown>;
      return cap(x.name) || [cap(x.givenName), cap(x.familyName)].filter(Boolean).join(" ");
    }).filter(Boolean);
    const rights = arr(row.rightsList);
    const license = cap((rights[0] as Record<string, unknown> | undefined)?.rightsUri || (rights[0] as Record<string, unknown> | undefined)?.rights);
    const types = row.types as Record<string, unknown> | undefined;
    const normalized = metadataResult({
      id: `datacite:${doi || entry.id || title}`, provider: "DataCite", title,
      url: safeExternalUrl(row.url, doi ? `https://doi.org/${doi}` : ""), doi,
      year: yearFromDate(row.publicationYear), authors, venue: cap(row.publisher) || null,
      resourceType: cap(types?.resourceTypeGeneral) || null, license: license || null,
      openAccess: license ? /creativecommons|cc-by|public domain|mit license|apache/i.test(license) : null,
      evidenceClass: "Metadatos DOI DataCite para resultados de investigación; no implican revisión por pares."
    });
    return normalized ? [normalized] : [];
  });
  return { items, state: { id: "datacite", name: "DataCite", status: items.length ? "ok" : "empty", count: items.length, note: "Incluye conjuntos de datos, software y otros productos; solo expone estados Findable en API pública." } };
}

async function searchRor(q: string): Promise<{ items: ResearchItem[]; state: ProviderState }> {
  const url = new URL("https://api.ror.org/v2/organizations");
  url.searchParams.set("query", q);
  const r = await fetchJson<RorResponse>(url.toString());
  if (!r.ok || !r.data) return { items: [], state: { id: "ror", name: "ROR", status: "unavailable", count: 0, note: r.error } };
  const items = arr(r.data.items).flatMap((entry) => {
    const row = entry as Record<string, unknown>;
    const names = arr(row.names);
    const primary = names.find((n) => (n as Record<string, unknown>)?.types && arr((n as Record<string, unknown>).types).includes("ror_display")) || names[0];
    const name = cap((primary as Record<string, unknown> | undefined)?.value);
    const urlValue = cap(row.id);
    if (!name || !urlValue) return [];
    return [{
      id: urlValue, provider: "ROR", title: name, url: safeExternalUrl(urlValue), doi: null, year: null, authors: [],
      venue: cap(row.status) || null, resourceType: "organization", citedByCount: null, license: null, openAccess: null,
      evidenceClass: "Registro del Research Organization Registry; su presencia no determina elegibilidad de TAMV.",
      retrievedAt: now(),
    }];
  });
  return { items, state: { id: "ror", name: "ROR", status: items.length ? "ok" : "empty", count: items.length, note: "API abierta de entidades organizacionales; consultar los criterios ROR por separado." } };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 4000) return NextResponse.json({ error: "La consulta excede el tamaño permitido." }, { status: 413 });
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch { return NextResponse.json({ error: "Se requiere JSON válido." }, { status: 400 }); }
  const query = typeof body.query === "string" ? body.query.trim().replace(/\s+/g, " ") : "";
  if (query.length < 3 || query.length > 180) return NextResponse.json({ error: "La consulta debe tener entre 3 y 180 caracteres." }, { status: 400 });
  const type = body.type === "organizations" ? "organizations" : "research";
  const results = type === "organizations"
    ? [await searchRor(query)]
    : await Promise.all([searchOpenAlex(query), searchCrossref(query), searchDataCite(query)]);
  const combined = results.flatMap((x) => x.items).slice(0, 30);
  const unique = new Map<string, ResearchItem>();
  for (const item of combined) {
    const key = (item.doi || item.url || item.title).toLowerCase();
    if (!unique.has(key)) unique.set(key, item);
  }
  const items = Array.from(unique.values()).slice(0, 24);
  return NextResponse.json({
    ok: true, query, type, retrievedAt: now(), results: items, providers: results.map((x) => x.state),
    methodology: "Búsqueda federada de metadatos públicos. Los registros se normalizan y deduplican por DOI, URL o título. La posición de un resultado no es una puntuación de calidad; las citas no se comparan como métricas equivalentes entre disciplinas.",
    sourceLinks: {
      googleScholar: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
      openAlex: `https://openalex.org/works?search=${encodeURIComponent(query)}`,
      arxiv: `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all`,
    },
  }, { headers: { "cache-control": "no-store" } });
}
