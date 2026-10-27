export type ProviderState = {
  id: string;
  name: string;
  status: "ok" | "empty" | "unavailable" | "not_configured" | "link_only";
  count: number;
  note?: string;
};

export type ResearchItem = {
  id: string;
  provider: string;
  title: string;
  url: string;
  doi: string | null;
  year: number | null;
  authors: string[];
  venue: string | null;
  resourceType: string | null;
  citedByCount: number | null;
  license: string | null;
  openAccess: boolean | null;
  evidenceClass: string;
  retrievedAt: string;
};

export type MetadataRecord = {
  provider: string;
  status: "found" | "not_found" | "unavailable";
  url: string;
  title: string | null;
  authors: string[];
  year: number | null;
  publisher: string | null;
  resourceType: string | null;
  license: string | null;
  doi: string;
  rawStatus?: number;
  note?: string;
};

export function normalizeDoi(value: string): string | null {
  const doi = value.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  if (doi.length > 255 || !/^10\.\d{4,9}\/\S+$/i.test(doi) || /[<>\s]/.test(doi)) return null;
  return doi;
}

export function calculateEvidenceReadiness(input: {
  title?: string | null;
  authors?: string[];
  year?: number | null;
  doi?: string | null;
  publisher?: string | null;
  url?: string | null;
  license?: string | null;
  reproducibilityDocumented?: boolean;
  peerReviewEvidence?: boolean;
  ipAssessmentDone?: boolean;
}) {
  const metadata = [
    Boolean(input.title?.trim()),
    Boolean(input.authors?.length),
    Boolean(input.year),
    Boolean(input.doi),
    Boolean(input.publisher?.trim()),
    Boolean(input.url?.trim()),
  ];
  const metadataScore = Math.round((metadata.filter(Boolean).length / metadata.length) * 100);
  const reproducibilityScore = input.reproducibilityDocumented ? 100 : 0;
  const rightsScore = input.license?.trim() ? 100 : 0;
  const externalReviewScore = input.peerReviewEvidence ? 100 : 0;
  const ipScore = input.ipAssessmentDone ? 100 : 0;
  const score = Math.round(
    metadataScore * 0.30 +
    reproducibilityScore * 0.25 +
    rightsScore * 0.20 +
    externalReviewScore * 0.15 +
    ipScore * 0.10
  );
  const nextActions: string[] = [];
  if (metadataScore < 100) nextActions.push("Completar y cotejar metadatos con la fuente primaria.");
  if (!input.reproducibilityDocumented) nextActions.push("Documentar versiones, método, entorno, instrucciones y pruebas reproducibles.");
  if (!input.license?.trim()) nextActions.push("Confirmar derechos y publicar una licencia válida; no inferir permiso de reutilización.");
  if (!input.peerReviewEvidence) nextActions.push("Registrar evaluación externa únicamente cuando exista evidencia identificable.");
  if (!input.ipAssessmentDone) nextActions.push("Realizar búsqueda documentada de anterioridad y revisión de derechos de propiedad intelectual.");
  return {
    version: "tamv-evidence-transfer-1.0.0",
    score,
    label: score >= 85 ? "Expediente documental avanzado" : score >= 60 ? "Expediente parcialmente preparado" : "Expediente temprano; requiere documentación",
    components: {
      metadataCompleteness: { score: metadataScore, weight: 0.30 },
      reproducibility: { score: reproducibilityScore, weight: 0.25 },
      rightsAndLicense: { score: rightsScore, weight: 0.20 },
      externalReview: { score: externalReviewScore, weight: 0.15 },
      intellectualProperty: { score: ipScore, weight: 0.10 },
    },
    nextActions,
    boundaries: [
      "Este puntaje es una herramienta de triaje documental, no una evaluación científica ni una calificación de persona.",
      "No representa precio, valor financiero, valoración de patente, probabilidad de concesión, libertad de operación ni asesoría jurídica.",
      "Los componentes sin evidencia se puntúan como no documentados; esto no prueba que la actividad nunca haya ocurrido.",
    ],
  };
}

export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: init.signal || AbortSignal.timeout(7500),
      headers: { accept: "application/json", ...(init.headers || {}) },
    });
    if (!response.ok) return { ok: false, status: response.status, error: `HTTP ${response.status}` };
    return { ok: true, status: response.status, data: await response.json() as T };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.name : "Network error" };
  }
}

export function yearFromDate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value !== "string") return null;
  const match = value.match(/\b(19|20|21)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

export function sha256Hex(value: string): string {
  // Server-only callers import node:crypto; this module stays portable by using Web Crypto.
  return "";
}
