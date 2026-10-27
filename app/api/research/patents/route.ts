import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeQuery(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.normalize("NFC").trim().replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").slice(0, 160);
}

async function epoSearch(query: string): Promise<Record<string, unknown>> {
  const key = process.env.EPO_OPS_KEY?.trim();
  const secret = process.env.EPO_OPS_SECRET?.trim();
  if (!key || !secret) return { provider: "EPO OPS", status: "not_configured", note: "Requiere credenciales registradas en el EPO Developer Portal.", url: "https://developers.epo.org/" };
  try {
    const tokenResponse = await fetch("https://ops.epo.org/3.2/auth/accesstoken", {
      method: "POST", headers: { authorization: "Basic " + Buffer.from(key + ":" + secret).toString("base64"), "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: "grant_type=client_credentials", cache: "no-store", signal: AbortSignal.timeout(7000),
    });
    if (!tokenResponse.ok) return { provider: "EPO OPS", status: "unavailable", note: `La autenticación OPS devolvió HTTP ${tokenResponse.status}.`, url: "https://developers.epo.org/" };
    const token = await tokenResponse.json() as { access_token?: string };
    if (!token.access_token) return { provider: "EPO OPS", status: "unavailable", note: "No se recibió un token OPS." };
    const cql = `ti="${query.replace(/["\\]/g, " ")}"`;
    const url = new URL("https://ops.epo.org/3.2/rest-services/published-data/search");
    url.searchParams.set("q", cql);
    const searchResponse = await fetch(url.toString(), { headers: { authorization: `Bearer ${token.access_token}`, accept: "application/exchange+xml" }, cache: "no-store", signal: AbortSignal.timeout(9000) });
    const xml = await searchResponse.text();
    if (!searchResponse.ok) return { provider: "EPO OPS", status: "unavailable", note: `La búsqueda OPS devolvió HTTP ${searchResponse.status}.`, url: "https://worldwide.espacenet.com/" };
    const matches: Array<{ publicationNumber: string; title: string }> = [];
    const docs = xml.match(/<exchange-document[\s\S]*?<\/exchange-document>/gi) || [];
    for (const doc of docs.slice(0, 10)) {
      const number = (doc.match(/<doc-number>([\s\S]*?)<\/doc-number>/i) || [])[1]?.replace(/<[^>]+>/g, "").trim() || "";
      const title = (doc.match(/<invention-title[^>]*>([\s\S]*?)<\/invention-title>/i) || [])[1]?.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim() || "Título no disponible en el fragmento recuperado";
      if (number) matches.push({ publicationNumber: number.slice(0, 80), title: title.slice(0, 400) });
    }
    return { provider: "EPO OPS", status: matches.length ? "ok" : "empty", count: matches.length, results: matches, note: "Búsqueda bibliográfica preliminar. No constituye opinión de patentabilidad ni libertad de operación.", queryUsed: cql, url: "https://worldwide.espacenet.com/" };
  } catch (error) {
    return { provider: "EPO OPS", status: "unavailable", note: error instanceof Error ? error.name : "Error de red", url: "https://developers.epo.org/" };
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { const raw = await request.text(); if(raw.length > 2000) return NextResponse.json({error:"La consulta excede el tamaño permitido."},{status:413}); body = JSON.parse(raw) as Record<string,unknown>; }
  catch { return NextResponse.json({error:"Se requiere JSON válido."},{status:400}); }
  const query = safeQuery(body.query);
  if(query.length < 3) return NextResponse.json({error:"Introduce al menos tres caracteres para la búsqueda de anterioridad."},{status:400});
  const [epo] = await Promise.all([epoSearch(query)]);
  const q = encodeURIComponent(query);
  const usptoConfigured = Boolean(process.env.USPTO_ODP_API_KEY?.trim());
  return NextResponse.json({
    ok: true, query, checkedAt: new Date().toISOString(),
    providers: [
      epo,
      { provider: "USPTO Open Data Portal", status: usptoConfigured ? "credentials_available; endpoint not enabled in this adapter" : "not_configured", note: "La API oficial requiere una clave de API. Esta versión no emite una consulta de patentes USPTO hasta que se configura y valida un endpoint específico compatible con la clave.", url: "https://data.uspto.gov/apis/getting-started" },
      { provider: "WIPO PATENTSCOPE", status: "link_only", note: "No se automatiza la consulta porque los términos de WIPO prohíben consultas automatizadas y scraping. Usa el buscador oficial de forma manual.", url: `https://patentscope.wipo.int/search/en/search.jsf?query=${q}` },
      { provider: "Google Patents", status: "link_only", note: "Enlace a búsqueda exploratoria manual; los resultados requieren cotejo con registros oficiales nacionales.", url: `https://patents.google.com/?q=${q}` },
      { provider: "Espacenet", status: "link_only", note: "Búsqueda oficial manual en el portal de patentes europeo.", url: `https://worldwide.espacenet.com/patent/search?q=${q}` },
    ],
    limitations: [
      "La búsqueda por título o palabras clave no equivale a una búsqueda exhaustiva de anterioridad; deben probarse sinónimos, traducciones, clasificación IPC/CPC, familias y reivindicaciones.",
      "Una coincidencia textual no demuestra infracción, validez, novedad ni libertad de operación.",
      "La situación jurídica y las fechas deben cotejarse en registros oficiales y por jurisdicción.",
      "La evaluación jurídica debe realizarla un profesional competente; Isabella solo organiza evidencia y tareas de revisión.",
    ],
  }, { headers: { "cache-control": "no-store" } });
}
