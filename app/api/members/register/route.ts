import { NextResponse } from "next/server";
import { readSessionFromCookie, sameOriginRequest, sessionCookieName } from "@/lib/auth0-native";
import { registerTamvMember, SupabaseConfigurationError } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TERMS_VERSION = "1.0.0";
const PRIVACY_VERSION = "1.0.0";
const ALLOWED_AREAS = new Set([
  "IA responsable", "Software abierto", "Ciencia abierta", "Memoria territorial",
  "Seguridad y privacidad", "Datos e interoperabilidad", "Diseño y experiencia",
  "Música y creación", "Educación", "Infraestructura digital", "Patrimonio y cultura",
]);

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max);
}

function validOrcid(input: string): string | null {
  const value = input.trim().replace(/^https?:\/\/(www\.)?orcid\.org\//i, "").replace(/[\s-]/g, "").toUpperCase();
  if (!/^\d{15}[\dX]$/.test(value)) return null;
  let total = 0;
  for (const digit of value.slice(0, 15)) total = (total + Number(digit)) * 2;
  const remainder = total % 11;
  const result = (12 - remainder) % 11;
  const check = result === 10 ? "X" : String(result);
  if (check !== value[15]) return null;
  return `https://orcid.org/${value.slice(0,4)}-${value.slice(4,8)}-${value.slice(8,12)}-${value.slice(12)}`;
}

function validIsni(input: string): string | null {
  const value = input.trim().replace(/^https?:\/\/(www\.)?isni\.org\//i, "").replace(/[\s-]/g, "").toUpperCase();
  if (!/^\d{15}[\dX]$/.test(value)) return null;
  let total = 0;
  for (const digit of value.slice(0, 15)) total = (total + Number(digit)) * 2;
  const result = (12 - (total % 11)) % 11;
  const check = result === 10 ? "X" : String(result);
  if (check !== value[15]) return null;
  return value.replace(/(.{4})(.{4})(.{4})(.{4})/, "$1 $2 $3 $4");
}

function validHttpsUrl(value: string, allowedHost?: string): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port) return null;
    if (allowedHost && parsed.hostname.toLowerCase() !== allowedHost) return null;
    if (!allowedHost && (parsed.hostname === "localhost" || !parsed.hostname.includes("."))) return null;
    return parsed.toString().slice(0, 500);
  } catch { return null; }
}

function configuredForRegistration(): boolean {
  return process.env.TAMV_REGISTRATION_ENABLED === "true"
    && Boolean(process.env.TAMV_DATA_CONTROLLER_NAME?.trim())
    && Boolean(process.env.TAMV_DATA_CONTROLLER_ADDRESS?.trim())
    && Boolean(process.env.TAMV_PRIVACY_CONTACT_EMAIL?.trim());
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "La solicitud no procede del mismo origen." }, { status: 403 });
  if (process.env.TAMV_REGISTRATION_ENABLED !== "true") {
    return NextResponse.json({ error: "El registro está en fase de preparación. El equipo debe completar la configuración de lanzamiento antes de abrir inscripciones." }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  if (!configuredForRegistration()) {
    return NextResponse.json({ error: "Falta completar la configuración del responsable del tratamiento y su canal de privacidad antes de aceptar registros." }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  const cookie = request.headers.get("cookie")?.split(";").map((item) => item.trim()).find((item) => item.startsWith(sessionCookieName() + "="))?.slice(sessionCookieName().length + 1);
  const session = readSessionFromCookie(cookie);
  if (!session) return NextResponse.json({ error: "Inicia sesión con Auth0 para continuar." }, { status: 401 });
  if (!session.email || !session.emailVerified) return NextResponse.json({ error: "Tu cuenta de identidad debe tener un correo verificado para registrar un TAMV ID." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 16_000) return NextResponse.json({ error: "El formulario excede el tamaño permitido." }, { status: 413 });
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "El formulario no contiene JSON válido." }, { status: 400 });
  }

  if (body.termsAccepted !== true || body.privacyAccepted !== true) {
    return NextResponse.json({ error: "Debes aceptar los términos de participación y reconocer el aviso de privacidad vigente." }, { status: 400 });
  }

  const displayName = text(body.displayName, 100);
  const bio = text(body.bio, 600) || null;
  const affiliation = text(body.affiliation, 180) || null;
  const countryCode = text(body.countryCode, 2).toUpperCase() || null;
  const visibility = body.visibility === "public" ? "public" : "private";
  const publicConsent = body.publicProfileConsent === true;
  if (displayName.length < 2) return NextResponse.json({ error: "El nombre público debe tener entre 2 y 100 caracteres." }, { status: 400 });
  if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) return NextResponse.json({ error: "Utiliza un código de país ISO 3166-1 alpha-2 de dos letras." }, { status: 400 });
  if (visibility === "public" && !publicConsent) return NextResponse.json({ error: "Activa expresamente el consentimiento de publicación para hacer público el perfil." }, { status: 400 });

  const rawAreas = Array.isArray(body.researchAreas) ? body.researchAreas : [];
  if (rawAreas.length > 8) return NextResponse.json({ error: "Selecciona un máximo de ocho áreas." }, { status: 400 });
  const researchAreas = [...new Set(rawAreas.map((area) => text(area, 80)).filter((area) => ALLOWED_AREAS.has(area)))];

  const identifiers: Array<{ scheme: "ORCID" | "ISNI" | "GITHUB" | "WEBSITE"; value: string; normalized_value: string }> = [];
  const orcidInput = text(body.orcid, 200);
  if (orcidInput) {
    const normalized = validOrcid(orcidInput);
    if (!normalized) return NextResponse.json({ error: "El ORCID no tiene un formato o dígito de control válido." }, { status: 400 });
    identifiers.push({ scheme: "ORCID", value: normalized, normalized_value: normalized.toLowerCase() });
  }
  const isniInput = text(body.isni, 200);
  if (isniInput) {
    const normalized = validIsni(isniInput);
    if (!normalized) return NextResponse.json({ error: "El ISNI no tiene un formato o dígito de control válido." }, { status: 400 });
    identifiers.push({ scheme: "ISNI", value: normalized, normalized_value: normalized.replace(/[\s-]/g, "").toLowerCase() });
  }
  const githubInput = text(body.githubUrl, 500);
  if (githubInput) {
    const normalized = validHttpsUrl(githubInput, "github.com");
    if (!normalized || new URL(normalized).pathname.split("/").filter(Boolean).length < 1) return NextResponse.json({ error: "Introduce la URL HTTPS de un perfil de GitHub válido." }, { status: 400 });
    identifiers.push({ scheme: "GITHUB", value: normalized, normalized_value: normalized.toLowerCase() });
  }
  const websiteInput = text(body.websiteUrl, 500);
  if (websiteInput) {
    const normalized = validHttpsUrl(websiteInput);
    if (!normalized) return NextResponse.json({ error: "El sitio personal debe usar una URL HTTPS válida." }, { status: 400 });
    identifiers.push({ scheme: "WEBSITE", value: normalized, normalized_value: normalized.toLowerCase() });
  }

  try {
    const result = await registerTamvMember({
      auth0Sub: session.sub,
      email: session.email,
      emailVerified: session.emailVerified,
      displayName, bio, affiliation, countryCode, researchAreas,
      profileVisibility: visibility,
      publicProfileConsent: publicConsent,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
      identifiers,
    });
    return NextResponse.json({
      ok: true,
      member: {
        tamvId: result.tamv_id,
        displayName: result.display_name,
        membershipStatus: result.membership_status,
        profileVisibility: result.profile_visibility,
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      },
    }, { status: 200, headers: { "cache-control": "no-store, private" } });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return NextResponse.json({ error: "La base de datos no está completamente configurada en el entorno de servidor." }, { status: 503 });
    const status = typeof error === "object" && error !== null && "status" in error ? Number((error as { status: unknown }).status) : 500;
    if (status === 404) return NextResponse.json({ error: "La migración del registro TAMV ID aún no está aplicada en Supabase." }, { status: 503 });
    if (status === 409) return NextResponse.json({ error: "El registro colisionó con un dato existente. Vuelve a enviar el formulario; no se ha creado un segundo identificador." }, { status: 409 });
    console.error("TAMV registration failed", { status: Number.isFinite(status) ? status : 500 });
    return NextResponse.json({ error: "No fue posible guardar el registro. Verifica la migración de Supabase y los permisos del servidor." }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
