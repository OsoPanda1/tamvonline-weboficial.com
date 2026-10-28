import { NextResponse } from "next/server";
import { fetchJson, type ProviderState, type ResearchItem, yearFromDate } from "@/lib/research-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpenAlexResponse = { results?: Array<Record<string, unknown>> };
type CrossrefResponse = { message?: { items?: Array<Record<string, unknown>> } };
type DataCiteResponse = { data?: Array<{ id?: string; attributes?: Record<string, unknown> }> };
type RorResponse = { items?: Array<Record<string, unknown>> };
type OpenAireResponse = { results?: Array<Record<string, unknown>>; header?: Record<string, unknown> };
type PubMedSearchResponse = { esearchresult?: { idlist?: string[] } };
type PubMedSummaryResponse = { result?: { uids?: string[]; [key: string]: unknown } };

function cap(value: unknown, max = 240): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function arr(value: unknown): any[] { return Array.isArray(value) ? value : []; }
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

async function searchOpenAire(q: string): Promise<{ items: ResearchItem[]; state: ProviderState }> {
  const url = new URL("https://api.openaire.eu/graph/v4/research-products");
  url.searchParams.set("search", q);
  url.searchParams.set("page_size", "8");
  if (process.env.TAMV_CONTACT_EMAIL) url.searchParams.set("mailto", process.env.TAMV_CONTACT_EMAIL);
  const response = await fetchJson<OpenAireResponse>(url.toString(), {
    headers: { "user-agent": `TAMV-Research-Audit/1.0 (https://tamv.online; mailto:${process.env.TAMV_CONTACT_EMAIL || "contact@example.invalid"})` },
  });
  if (!response.ok || !response.data) {
    return { items: [], state: { id: "openaire", name: "OpenAIRE Graph", status: "unavailable", count: 0, note: response.error } };
  }
  const rows = arr(response.data.results);
  const items = rows.flatMap((value) => {
    const row = value as Record<string, unknown>;
    const title = cap(row.mainTitle || row.title || row.titleText, 600);
    if (!title) return [];
    const ids = arr(row.pids || row.identifiers || row.ids);
    const doiEntry = ids.find((entry) => {
      const x = entry as Record<string, unknown>;
      return /doi/i.test(cap(x.scheme || x.type || x.identifierType));
    }) as Record<string, unknown> | undefined;
    const doiRaw = cap(row.doi || doiEntry?.value || doiEntry?.identifier);
    const doi = doiRaw.replace(/^https?:\/\/doi\.org\//i, "") || null;
    const rawAuthors = arr(row.authors || row.authorships);
    const authors = rawAuthors.flatMap((value) => {
      const a = value as Record<string, unknown>;
      const nested = (a.author || a.person || a.creator) as Record<string, unknown> | undefined;
      const name = cap(a.fullName || a.fullname || a.name || nested?.fullName || nested?.name ||
        [cap(a.givenName, 70), cap(a.familyName, 90)].filter(Boolean).join(" "), 120);
      return name ? [name] : [];
    });
    const year = yearFromDate(row.publicationDate || row.date || row.publicationYear);
    const publisher = cap(row.publisher || row.venue || row.sourceTitle);
    const resourceType = cap(row.publicationType || row.type);
    const openAireId = cap(row.id);
    const urlForItem = safeExternalUrl(row.url || row.landingPage || row.websiteUrl,
      doi ? `https://doi.org/${doi}` : openAireId ? `https://explore.openaire.eu/search/publication?pid=${encodeURIComponent(openAireId)}` : `https://explore.openaire.eu/search/publication?search=${encodeURIComponent(q)}`);
    const normalized = metadataResult({
      id: `openaire:${doi || openAireId || title}`, provider: "OpenAIRE Graph", title,
      url: urlForItem, doi, year, authors, venue: publisher || null,
      resourceType: resourceType || null,
      openAccess: typeof row.isOpenAccess === "boolean" ? row.isOpenAccess : null,
      evidenceClass: "Metadatos agregados por OpenAIRE Graph; el registro y su estado de acceso no certifican revisión por pares ni validez científica.",
    });
    return normalized ? [normalized] : [];
  });
  const total = Number((response.data.header as Record<string, unknown> | undefined)?.numFound);
  return {
    items,
    state: {
      id: "openaire", name: "OpenAIRE Graph", status: items.length ? "ok" : "empty", count: items.length,
      note: `Grafo público de productos de investigación; ${Number.isFinite(total) ? total : "cantidad total no reportada"} resultados reportados por el proveedor, máximo 8 consultados por petición.`,
    },
  };
}

async function searchPubMed(q: string): Promise<{ items: ResearchItem[]; state: ProviderState }> {
  const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
  searchUrl.searchParams.set("db", "pubmed");
  searchUrl.searchParams.set("term", q);
  searchUrl.searchParams.set("retmode", "json");
  searchUrl.searchParams.set("retmax", "6");
  searchUrl.searchParams.set("tool", "TAMVOnlineResearchAudit");
  if (process.env.TAMV_CONTACT_EMAIL) searchUrl.searchParams.set("email", process.env.TAMV_CONTACT_EMAIL);
  if (process.env.NCBI_API_KEY) searchUrl.searchParams.set("api_key", process.env.NCBI_API_KEY);

  const found = await fetchJson<PubMedSearchResponse>(searchUrl.toString());
  if (!found.ok || !found.data) {
    return { items: [], state: { id: "pubmed", name: "PubMed / NCBI", status: "unavailable", count: 0, note: found.error } };
  }
  const ids = arr(found.data.esearchresult?.idlist).filter((id): id is string => typeof id === "string" && /^\d+$/.test(id)).slice(0, 6);
  if (!ids.length) return { items: [], state: { id: "pubmed", name: "PubMed / NCBI", status: "empty", count: 0, note: "No se encontraron registros en esta consulta." } };

  const summaryUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
  summaryUrl.searchParams.set("db", "pubmed");
  summaryUrl.searchParams.set("id", ids.join(","));
  summaryUrl.searchParams.set("retmode", "json");
  summaryUrl.searchParams.set("tool", "TAMVOnlineResearchAudit");
  if (process.env.TAMV_CONTACT_EMAIL) summaryUrl.searchParams.set("email", process.env.TAMV_CONTACT_EMAIL);
  if (process.env.NCBI_API_KEY) summaryUrl.searchParams.set("api_key", process.env.NCBI_API_KEY);

  const summary = await fetchJson<PubMedSummaryResponse>(summaryUrl.toString());
  if (!summary.ok || !summary.data?.result) {
    return { items: [], state: { id: "pubmed", name: "PubMed / NCBI", status: "unavailable", count: 0, note: summary.error || "NCBI no devolvió el resumen bibliográfico." } };
  }
  const rows = ids.flatMap((id) => {
    const row = summary.data?.result?.[id] as Record<string, unknown> | undefined;
    if (!row) return [];
    const title = cap(row.title, 600);
    if (!title) return [];
    const idsRaw = arr(row.articleids);
    const doiItem = idsRaw.find((item) => /doi/i.test(cap((item as Record<string, unknown>)?.idtype)));
    const doi = cap((doiItem as Record<string, unknown> | undefined)?.value).replace(/^https?:\/\/doi\.org\//i, "") || null;
    const authors = arr(row.authors).flatMap((author) => {
      const name = cap((author as Record<string, unknown>)?.name, 120);
      return name ? [name] : [];
    });
    const year = yearFromDate(row.pubdate);
    const journal = cap(row.fulljournalname || row.source);
    const normalized = metadataResult({
      id: `pubmed:${id}`, provider: "PubMed / NCBI", title,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`, doi, year, authors,
      venue: journal || null, resourceType: "biomedical-literature",
      evidenceClass: "Registro bibliográfico de PubMed/NCBI; la indexación no sustituye lectura crítica ni confirma todos los resultados del artículo.",
    });
    return normalized ? [normalized] : [];
  });
  return { items: rows, state: { id: "pubmed", name: "PubMed / NCBI", status: rows.length ? "ok" : "empty", count: rows.length, note: "Consulta de metadatos a través de NCBI E-utilities; los derechos del texto completo dependen del artículo y de PMC." } };
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
    : await Promise.all([searchOpenAlex(query), searchCrossref(query), searchDataCite(query), searchOpenAire(query), searchPubMed(query)]);
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
      openAire: `https://explore.openaire.eu/search/publication?search=${encodeURIComponent(query)}`,
      dimensions: `https://app.dimensions.ai/discover/publication?search_text=${encodeURIComponent(query)}`,
      pubmed: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`,
    },
  }, { headers: { "cache-control": "no-store" } });
}
