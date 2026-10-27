import { NextResponse } from "next/server";
import { readSessionFromCookie, sameOriginRequest, sessionCookieName } from "@/lib/auth0-native";
import {
  getMemberByAuth0Sub, getVetraReviewQueue, getVetraProposalStatus, getVetraLatestReviewsForDecision,
  markVetraProposalInReview, saveVetraReview, SupabaseConfigurationError,
} from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOMAIN_KEYS = new Set([
  "scientificValidity","technicalRobustness","security","privacy","ethics","reproducibility",
  "governance","socialImpact","economicViability","scientificIntegrity","cognitiveReliability",
  "metaEvaluation","evidenceProvenance","futureConsequences",
]);
const RECOMMENDATIONS = new Set(["minor_revision","major_revision","accept_with_conditions","reject","recuse"]);
const OPEN_STATUSES = new Set(["received","administrative_screening","independent_review"]);

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.normalize("NFC").trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,"").slice(0,max);
}
function allowedEmails(name: string): Set<string> {
  return new Set((process.env[name] || "").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean));
}
function featureReady(): boolean {
  return process.env.TAMV_VETRA_REVIEW_CONSOLE_ENABLED === "true"
    && process.env.TAMV_VETRA_SCHEMA_VERIFIED === "true"
    && process.env.TAMV_VETRA_RETENTION_POLICY_APPROVED === "true"
    && process.env.TAMV_VETRA_GOVERNANCE_APPROVED === "true"
    && Boolean(process.env.TAMV_DATA_CONTROLLER_NAME?.trim())
    && Boolean(process.env.TAMV_DATA_CONTROLLER_ADDRESS?.trim())
    && Boolean(process.env.TAMV_PRIVACY_CONTACT_EMAIL?.trim());
}
async function authorizedReviewer(request: Request) {
  const cookie=request.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(sessionCookieName()+"="))?.slice(sessionCookieName().length+1);
  const session=readSessionFromCookie(cookie);
  if(!session || !session.email || !session.emailVerified) return {error:NextResponse.json({error:"Se requiere sesión Auth0 con correo verificado."},{status:401,headers:{"cache-control":"no-store"}})} as const;
  if(!allowedEmails("TAMV_VETRA_REVIEWER_EMAILS").has(session.email.toLowerCase())) return {error:NextResponse.json({error:"Esta cuenta no está autorizada como revisora VETRA. La autorización debe proceder de la gobernanza aprobada, no del propio formulario."},{status:403,headers:{"cache-control":"no-store"}})} as const;
  const member=await getMemberByAuth0Sub(session.sub);
  if(!member || member.membership_status!=="approved" || !member.email_verified) return {error:NextResponse.json({error:"La persona revisora debe tener un TAMV ID aprobado y correo verificado."},{status:403,headers:{"cache-control":"no-store"}})} as const;
  return {session,member} as const;
}
function httpsReference(value: unknown): string | null {
  if(typeof value!=="string"||value.length>800) return null;
  try { const u=new URL(value.trim()); if(u.protocol!=="https:"||u.username||u.password||u.port||u.hostname==="localhost"||!u.hostname.includes(".")) return null; return u.toString(); }
  catch { return null; }
}

export async function GET(request:Request) {
  if(!featureReady()) return NextResponse.json({error:"La consola de revisión VETRA está cerrada hasta aprobar gobernanza, privacidad, política de retención y seguridad de Supabase."},{status:503,headers:{"cache-control":"no-store"}});
  try {
    const auth=await authorizedReviewer(request);
    if("error" in auth) return auth.error;
    const queue=await getVetraReviewQueue(40);
    return NextResponse.json({ok:true,items:queue,protocol:"VETRA-Ω∞-SOVEREIGN-1.0",note:"La asignación de cuentas revisoras debe corresponder a personas designadas y cuya competencia/conflictos se hayan comprobado fuera de este control de acceso."},{headers:{"cache-control":"no-store, private"}});
  } catch(error) {
    if(error instanceof SupabaseConfigurationError) return NextResponse.json({error:"Supabase no está configurado."},{status:503});
    console.error("VETRA reviewer queue failed");
    return NextResponse.json({error:"No fue posible cargar la cola privada de revisión."},{status:500,headers:{"cache-control":"no-store"}});
  }
}

export async function POST(request:Request) {
  if(!sameOriginRequest(request)) return NextResponse.json({error:"Origen de solicitud no permitido."},{status:403});
  if(!featureReady()) return NextResponse.json({error:"La consola de revisión VETRA está cerrada hasta aprobar gobernanza, privacidad, política de retención y seguridad de Supabase."},{status:503,headers:{"cache-control":"no-store"}});
  let body:Record<string,unknown>;
  try { const raw=await request.text(); if(raw.length>16000) return NextResponse.json({error:"La revisión excede el tamaño permitido."},{status:413}); body=JSON.parse(raw) as Record<string,unknown>; }
  catch { return NextResponse.json({error:"Se requiere una revisión JSON válida."},{status:400}); }

  const proposalId=text(body.proposalId,64);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(proposalId)) return NextResponse.json({error:"Identificador de propuesta inválido."},{status:400});
  const reviewerRole=text(body.reviewerRole,120);
  const rationale=text(body.rationale,8000);
  const recommendation=text(body.recommendation,40);
  if(reviewerRole.length<3) return NextResponse.json({error:"Declara el ámbito de competencia bajo el que revisaste la propuesta."},{status:400});
  if(rationale.length<100) return NextResponse.json({error:"El dictamen necesita al menos 100 caracteres de justificación sustentada."},{status:400});
  if(!RECOMMENDATIONS.has(recommendation)) return NextResponse.json({error:"Recomendación de revisión no reconocida."},{status:400});

  const independence=body.independenceDeclaration && typeof body.independenceDeclaration==="object" ? body.independenceDeclaration as Record<string,unknown> : {};
  const independenceDeclaration={
    hasConflict:independence.hasConflict===true,
    financialInterest:independence.financialInterest===true,
    involvedInDevelopment:independence.involvedInDevelopment===true,
    recentCollaboration:independence.recentCollaboration===true,
    otherRelationship:text(independence.otherRelationship,1000),
    declarationSubmitted:independence.declarationSubmitted===true,
  };
  if(!independenceDeclaration.declarationSubmitted) return NextResponse.json({error:"Confirma la declaración de independencia y conflicto de interés."},{status:400});
  const conflict=independenceDeclaration.hasConflict||independenceDeclaration.financialInterest||independenceDeclaration.involvedInDevelopment||independenceDeclaration.recentCollaboration||Boolean(independenceDeclaration.otherRelationship);
  if(conflict&&recommendation!=="recuse") return NextResponse.json({error:"Hay una relación declarada: debes recusarte. No envíes una puntuación sustantiva para una propuesta con conflicto."},{status:409});
  if(recommendation==="recuse"&&!conflict&&!independenceDeclaration.otherRelationship&&rationale.trim().length<100) return NextResponse.json({error:"La recusación debe incluir una justificación."},{status:400});

  const rawScores=body.domainScores&&typeof body.domainScores==="object"?body.domainScores as Record<string,unknown>:{};
  const domainScores:Record<string,number>={};
  if(recommendation!=="recuse"){
    const keys=Object.keys(rawScores);
    if(keys.length===0||keys.some(key=>!DOMAIN_KEYS.has(key))) return NextResponse.json({error:"Selecciona al menos un dominio permitido y asigna su nota."},{status:400});
    for(const key of keys){
      const value=rawScores[key];
      if(typeof value!=="number"||!Number.isInteger(value)||value<0||value>4) return NextResponse.json({error:"Cada dominio debe puntuarse entre 0 y 4, como entero."},{status:400});
      domainScores[key]=value;
    }
  }
  const rawFailures=Array.isArray(body.criticalFailures)?body.criticalFailures:[];
  if(rawFailures.length>12) return NextResponse.json({error:"Registra hasta 12 fallos críticos concretos."},{status:400});
  const criticalFailures=rawFailures.map(x=>text(x,240)).filter(Boolean);
  if(recommendation==="accept_with_conditions"&&criticalFailures.length>0) return NextResponse.json({error:"Una revisión que identifica fallos críticos no puede recomendar aceptación. El fallo debe mitigarse y reevaluarse primero."},{status:409});

  const refs=Array.isArray(body.evidenceReferences)?body.evidenceReferences:[];
  if(refs.length>40) return NextResponse.json({error:"Se permiten hasta 40 referencias de evidencia."},{status:400});
  const evidenceReferences:Array<{label:string;url:string}>=[];
  for(const raw of refs){
    if(!raw||typeof raw!=="object") return NextResponse.json({error:"Referencia de evidencia inválida."},{status:400});
    const row=raw as Record<string,unknown>,label=text(row.label,120),url=httpsReference(row.url);
    if(!label||!url) return NextResponse.json({error:"Cada evidencia necesita una etiqueta y URL HTTPS válida."},{status:400});
    evidenceReferences.push({label,url});
  }

  try{
    const auth=await authorizedReviewer(request);
    if("error" in auth) return auth.error;
    const proposal=await getVetraProposalStatus(proposalId);
    if(!proposal||!OPEN_STATUSES.has(proposal.status)) return NextResponse.json({error:"La propuesta no existe o no admite una revisión nueva en su estado actual."},{status:404});
    if(proposal.submitted_by_tamv_id===auth.member.tamv_id) return NextResponse.json({error:"No puedes revisar una propuesta vinculada a tu propio TAMV ID. Debes recusarte y derivarla a otra persona."},{status:409});
    const previous=await getVetraLatestReviewsForDecision(proposalId);
    if(previous.some(x=>x.reviewer_tamv_id===auth.member.tamv_id)) return NextResponse.json({error:"Ya existe una revisión registrada por este TAMV ID para la propuesta. Para corregir un dictamen, debe habilitarse un flujo versionado de revisión."},{status:409});
    const result=await saveVetraReview({
      proposalId,reviewerTamvId:auth.member.tamv_id,reviewerRole,
      independenceDeclaration,domainScores:{scores:domainScores,criticalFailures},
      recommendation:recommendation as "minor_revision"|"major_revision"|"accept_with_conditions"|"reject"|"recuse",
      rationale,evidenceReferences,
    });
    if(recommendation!=="recuse") await markVetraProposalInReview(proposalId);
    return NextResponse.json({ok:true,review:{id:result.id,recommendation:result.recommendation,createdAt:result.created_at},message:recommendation==="recuse"?"La recusación quedó registrada y la propuesta debe reasignarse.":"La revisión quedó registrada de forma privada; no equivale al dictamen final del comité."},{status:201,headers:{"cache-control":"no-store, private"}});
  }catch(error){
    if(error instanceof SupabaseConfigurationError) return NextResponse.json({error:"Supabase no está configurado."},{status:503});
    console.error("VETRA review submission failed");
    return NextResponse.json({error:"No fue posible guardar la revisión. Confirma que la migración 003 está aplicada y que sus permisos se han verificado."},{status:500,headers:{"cache-control":"no-store"}});
  }
}
