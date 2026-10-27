import { NextResponse } from "next/server";
import { readSessionFromCookie, sameOriginRequest, sessionCookieName } from "@/lib/auth0-native";
import { createVetraProposal, getMemberByAuth0Sub, SupabaseConfigurationError } from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(["research","software","ai_system","dataset","infrastructure","education","territorial_knowledge","other"]);
const STAGES = new Set(["concept","method","prototype","tested","deployed"]);

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, max);
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 800) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (url.hostname === "localhost" || !url.hostname.includes(".")) return null;
    return url.toString();
  } catch { return null; }
}

function configured(): boolean {
  return process.env.TAMV_VETRA_SUBMISSIONS_ENABLED === "true"
    && Boolean(process.env.TAMV_DATA_CONTROLLER_NAME?.trim())
    && Boolean(process.env.TAMV_DATA_CONTROLLER_ADDRESS?.trim())
    && Boolean(process.env.TAMV_PRIVACY_CONTACT_EMAIL?.trim())
    && process.env.TAMV_VETRA_RETENTION_POLICY_APPROVED === "true"
    && process.env.TAMV_VETRA_SCHEMA_VERIFIED === "true";
}

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) {
    return NextResponse.json({ error: "Origen de solicitud no permitido." }, { status: 403, headers: { "cache-control": "no-store" } });
  }
  if (!configured()) {
    return NextResponse.json({
      error: "La recepción VETRA está cerrada durante la preparación del piloto. Antes de abrirla hay que aplicar la migración 003, probar accesos/RLS, aprobar el aviso de privacidad y la política de retención, confirmar TAMV_VETRA_SCHEMA_VERIFIED=true tras ejecutar el test SQL, y activar TAMV_VETRA_SUBMISSIONS_ENABLED.",
      submissionsEnabled: false,
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  const cookie = request.headers.get("cookie")?.split(";").map((item) => item.trim())
    .find((item) => item.startsWith(sessionCookieName() + "="))
    ?.slice(sessionCookieName().length + 1);
  const session = readSessionFromCookie(cookie);
  if (!session) return NextResponse.json({ error: "Inicia sesión con Auth0 y registra tu TAMV ID para presentar una propuesta." }, { status: 401, headers: { "cache-control": "no-store" } });
  if (!session.emailVerified) return NextResponse.json({ error: "Se necesita una cuenta con correo verificado." }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 26_000) return NextResponse.json({ error: "La propuesta excede el límite de tamaño." }, { status: 413 });
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la propuesta debe ser JSON válido." }, { status: 400 });
  }

  const title = text(body.title, 180);
  const abstract = text(body.abstract, 3000);
  const problemStatement = text(body.problemStatement, 2500);
  const contributionClaim = text(body.contributionClaim, 2500);
  const methodology = text(body.methodology, 4000);
  const reproducibilityPlan = text(body.reproducibilityPlan, 4000);
  const ethicsAndHarm = text(body.ethicsAndHarm, 3000);
  const privacyAndData = text(body.privacyAndData, 3000);
  const securityPlan = text(body.securityPlan, 2500);
  const rightsAndIp = text(body.rightsAndIp, 2500);
  const sustainabilityPlan = text(body.sustainabilityPlan, 2000);
  const fundingAndConflicts = text(body.fundingAndConflicts, 1500);
  const submitterAttested = body.submitterAttested === true;
  const declarations = body.filterDeclarations && typeof body.filterDeclarations === "object"
    ? body.filterDeclarations as Record<string, unknown>
    : {};

  if (title.length < 8) return NextResponse.json({ error: "El título debe tener al menos 8 caracteres." }, { status: 400 });
  if (typeof body.proposalType !== "string" || !TYPES.has(body.proposalType)) return NextResponse.json({ error: "Tipo de propuesta no reconocido." }, { status: 400 });
  if (typeof body.maturityStage !== "string" || !STAGES.has(body.maturityStage)) return NextResponse.json({ error: "Fase del proyecto no reconocida." }, { status: 400 });
  const requiredFields: Array<[string,string,number]> = [
    ["abstract",abstract,120],["problemStatement",problemStatement,80],["contributionClaim",contributionClaim,50],
    ["methodology",methodology,100],["reproducibilityPlan",reproducibilityPlan,100],
    ["ethicsAndHarm",ethicsAndHarm,80],["privacyAndData",privacyAndData,80],
    ["securityPlan",securityPlan,80],["rightsAndIp",rightsAndIp,80],
    ["sustainabilityPlan",sustainabilityPlan,60],["fundingAndConflicts",fundingAndConflicts,30],
  ];
  const missing = requiredFields.find(([,value,min]) => value.length < min);
  if (missing) return NextResponse.json({ error: "Falta desarrollar un campo obligatorio: " + missing[0] + "." }, { status: 400 });
  if (!submitterAttested) return NextResponse.json({ error: "Debes confirmar la autoría, veracidad de declaraciones y uso legítimo de materiales." }, { status: 400 });

  const filterDeclarations = {
    filter1IntegrityAndProvenance: declarations.filter1IntegrityAndProvenance === true,
    filter2MethodAndReproducibility: declarations.filter2MethodAndReproducibility === true,
    filter3ResponsibleUseAndRights: declarations.filter3ResponsibleUseAndRights === true,
    understandsDeclarationsAreNotApproval: declarations.understandsDeclarationsAreNotApproval === true,
  };
  if (Object.values(filterDeclarations).some((value) => !value)) {
    return NextResponse.json({ error: "Confirma los tres filtros y comprende que las declaraciones no equivalen a una aprobación." }, { status: 400 });
  }

  const rawSources = Array.isArray(body.sourcesAndArtifacts) ? body.sourcesAndArtifacts.slice(0, 20) : [];
  const sourcesAndArtifacts: Array<{label:string;url:string}> = [];
  for (const raw of rawSources) {
    if (!raw || typeof raw !== "object") return NextResponse.json({ error: "Referencia externa inválida." }, { status: 400 });
    const row = raw as Record<string, unknown>;
    const label = text(row.label, 120);
    const url = httpsUrl(row.url);
    if (!label || !url) return NextResponse.json({ error: "Cada referencia debe tener una etiqueta y URL HTTPS válida." }, { status: 400 });
    sourcesAndArtifacts.push({ label, url });
  }

  try {
    const member = await getMemberByAuth0Sub(session.sub);
    if (!member) return NextResponse.json({ error: "Completa primero tu registro TAMV ID." }, { status: 403 });
    if (!member.email_verified || member.membership_status === "suspended" || member.membership_status === "rejected") {
      return NextResponse.json({ error: "Tu ficha no cumple las condiciones de acceso al formulario VETRA." }, { status: 403 });
    }
    const proposal = await createVetraProposal({
      submittedByTamvId: member.tamv_id,
      submitterDisplayName: member.display_name || text(session.name, 120) || "Miembro TAMV",
      title,
      proposalType: body.proposalType as "research" | "software" | "ai_system" | "dataset" | "infrastructure" | "education" | "territorial_knowledge" | "other",
      maturityStage: body.maturityStage as "concept" | "method" | "prototype" | "tested" | "deployed",
      abstract, problemStatement, contributionClaim, methodology, reproducibilityPlan,
      sourcesAndArtifacts, ethicsAndHarm, privacyAndData, securityPlan, rightsAndIp,
      sustainabilityPlan, fundingAndConflicts, filterDeclarations,
    });
    return NextResponse.json({
      ok: true,
      proposal: { code: proposal.proposal_code, status: proposal.status, receivedAt: proposal.created_at },
      message: "Propuesta recibida para control administrativo. Aún no ha sido revisada, aceptada, publicada ni certificada.",
    }, { status: 201, headers: { "cache-control": "no-store, private" } });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) return NextResponse.json({ error: "La base de datos no está configurada para VETRA." }, { status: 503 });
    console.error("VETRA proposal submission failed");
    return NextResponse.json({ error: "No se pudo registrar la propuesta. Verifica que la migración VETRA 003 esté aplicada y que el rol de servidor tenga permisos." }, { status: 500, headers: { "cache-control": "no-store" } });
  }
}
