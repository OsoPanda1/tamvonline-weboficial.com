import { NextResponse } from "next/server";
import { readSessionFromCookie, sameOriginRequest, sessionCookieName } from "@/lib/auth0-native";
import {
  createVetraDecision, getMemberByAuth0Sub, getVetraProposalStatus, getVetraLatestReviewsForDecision,
  SupabaseConfigurationError,
} from "@/lib/supabase-rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOMAINS = [
  "scientificValidity","technicalRobustness","security","privacy","ethics","reproducibility",
  "governance","socialImpact","economicViability","scientificIntegrity","cognitiveReliability",
  "metaEvaluation","evidenceProvenance","futureConsequences",
] as const;
const DECISIONS = new Set(["minor_revision","major_revision","accepted_with_conditions","rejected","suspended","withdrawn"]);
const OPEN_STATUSES = new Set(["received","administrative_screening","independent_review","minor_revision","major_revision"]);

function text(value:unknown,max:number):string{
  if(typeof value!=="string") return "";
  return value.normalize("NFC").trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,"").slice(0,max);
}
function allowlisted(email:string):boolean{
  return new Set((process.env.TAMV_VETRA_DECISION_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean)).has(email.toLowerCase());
}
function featureReady():boolean{
  return process.env.TAMV_VETRA_DECISION_CONSOLE_ENABLED==="true"
    && process.env.TAMV_VETRA_SCHEMA_VERIFIED==="true"
    && process.env.TAMV_VETRA_RETENTION_POLICY_APPROVED==="true"
    && process.env.TAMV_VETRA_GOVERNANCE_APPROVED==="true"
    && Boolean(process.env.TAMV_DATA_CONTROLLER_NAME?.trim())
    && Boolean(process.env.TAMV_DATA_CONTROLLER_ADDRESS?.trim())
    && Boolean(process.env.TAMV_PRIVACY_CONTACT_EMAIL?.trim());
}
async function authorizedDecisionMaker(request:Request){
  const cookie=request.headers.get("cookie")?.split(";").map(x=>x.trim()).find(x=>x.startsWith(sessionCookieName()+"="))?.slice(sessionCookieName().length+1);
  const session=readSessionFromCookie(cookie);
  if(!session||!session.email||!session.emailVerified) return {error:NextResponse.json({error:"Se requiere sesión Auth0 con correo verificado."},{status:401,headers:{"cache-control":"no-store"}})} as const;
  if(!allowlisted(session.email)) return {error:NextResponse.json({error:"La cuenta no está autorizada como responsable de decisión VETRA."},{status:403,headers:{"cache-control":"no-store"}})} as const;
  const member=await getMemberByAuth0Sub(session.sub);
  if(!member||member.membership_status!=="approved"||!member.email_verified) return {error:NextResponse.json({error:"El responsable de decisión necesita un TAMV ID aprobado y correo verificado."},{status:403,headers:{"cache-control":"no-store"}})} as const;
  return {session,member} as const;
}

export async function GET(request:Request){
  if(!featureReady()) return NextResponse.json({error:"La consola de decisiones VETRA está deshabilitada hasta aprobar gobernanza, política de retención y seguridad de Supabase."},{status:503,headers:{"cache-control":"no-store"}});
  try{
    const auth=await authorizedDecisionMaker(request);
    if("error" in auth) return auth.error;
    const queue=await getVetraReviewQueue(40);
    const items=await Promise.all(queue.map(async proposal=>({
      proposal,
      reviews:await getVetraLatestReviewsForDecision(proposal.id),
    })));
    return NextResponse.json({ok:true,items,note:"Vista exclusiva del responsable de decisión allowlisted. Las revisiones y sus justificaciones son confidenciales."},{headers:{"cache-control":"no-store, private"}});
  }catch(error){
    if(error instanceof SupabaseConfigurationError)return NextResponse.json({error:"Supabase no está configurado."},{status:503});
    console.error("VETRA decision queue failed");
    return NextResponse.json({error:"No fue posible cargar los expedientes para decisión."},{status:500,headers:{"cache-control":"no-store"}});
  }
}

export async function POST(request:Request){
  if(!sameOriginRequest(request)) return NextResponse.json({error:"Origen de solicitud no permitido."},{status:403});
  if(!featureReady()) return NextResponse.json({error:"La decisión VETRA está deshabilitada hasta aprobar gobernanza, política de retención y seguridad de Supabase."},{status:503,headers:{"cache-control":"no-store"}});
  let body:Record<string,unknown>;
  try{const raw=await request.text();if(raw.length>12000)return NextResponse.json({error:"La solicitud excede el tamaño permitido."},{status:413});body=JSON.parse(raw) as Record<string,unknown>;}
  catch{return NextResponse.json({error:"Se requiere JSON válido."},{status:400});}
  const proposalId=text(body.proposalId,64);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(proposalId)) return NextResponse.json({error:"Identificador de propuesta inválido."},{status:400});
  const status=text(body.decisionStatus,40);
  if(!DECISIONS.has(status)) return NextResponse.json({error:"Estado de decisión no permitido."},{status:400});
  const rationale=text(body.rationale,8000);
  if(rationale.length<100) return NextResponse.json({error:"La resolución debe motivarse con al menos 100 caracteres."},{status:400});
  const conditionsRaw=Array.isArray(body.conditions)?body.conditions:[];
  if(conditionsRaw.length>40) return NextResponse.json({error:"Se permiten hasta 40 condiciones."},{status:400});
  const conditions=conditionsRaw.map(x=>text(x,500));
  if(conditions.some(x=>!x)) return NextResponse.json({error:"Cada condición debe contener texto."},{status:400});
  if(status==="accepted_with_conditions"&&conditions.length===0) return NextResponse.json({error:"Una aceptación condicionada necesita al menos una condición explícita."},{status:400});
  const appealWindowDays=body.appealWindowDays===undefined?30:Number(body.appealWindowDays);
  if(!Number.isInteger(appealWindowDays)||appealWindowDays<0||appealWindowDays>180) return NextResponse.json({error:"La ventana de apelación debe estar entre 0 y 180 días."},{status:400});

  try{
    const auth=await authorizedDecisionMaker(request);
    if("error" in auth) return auth.error;
    const proposal=await getVetraProposalStatus(proposalId);
    if(!proposal||!OPEN_STATUSES.has(proposal.status)) return NextResponse.json({error:"La propuesta no existe o ya no admite una decisión final."},{status:404});
    const reviews=await getVetraLatestReviewsForDecision(proposalId);
    const eligible=reviews.filter(review=>{
      const declaration=review.independence_declaration||{};
      return review.recommendation!=="recuse"
        && Boolean(review.reviewer_tamv_id)
        && declaration.hasConflict!==true
        && declaration.financialInterest!==true
        && declaration.involvedInDevelopment!==true
        && declaration.recentCollaboration!==true
        && !text(declaration.otherRelationship,1000);
    });
    const reviewerIds=new Set(eligible.map(review=>review.reviewer_tamv_id).filter(Boolean));
    if(reviewerIds.size<3) return NextResponse.json({error:"No se puede decidir: se necesitan al menos tres revisiones independientes de personas distintas con conflictos comprobados."},{status:409});
    if(reviewerIds.has(auth.member.tamv_id)) return NextResponse.json({error:"El responsable de decisión participó como revisor de esta propuesta. Asigna a otra persona independiente para emitir la resolución final."},{status:409});

    const covered=new Set<string>();
    const criticalFailures:string[]=[];
    for(const review of eligible){
      const payload=review.domain_scores&&typeof review.domain_scores==="object"?review.domain_scores as Record<string,unknown>:{};
      const scores=payload.scores&&typeof payload.scores==="object"?payload.scores as Record<string,unknown>:{};
      for(const key of Object.keys(scores)) if(DOMAINS.includes(key as typeof DOMAINS[number])) covered.add(key);
      const critical=Array.isArray(payload.criticalFailures)?payload.criticalFailures:[];
      for(const item of critical){const normalized=text(item,240);if(normalized)criticalFailures.push(normalized);}
    }
    const missing=DOMAINS.filter(domain=>!covered.has(domain));
    if(missing.length) return NextResponse.json({error:"No se puede cerrar el expediente: faltan revisiones independientes de estos dominios: "+missing.join(", ")+".",missingDomains:missing},{status:409});
    if(status==="accepted_with_conditions"&&criticalFailures.length>0) return NextResponse.json({error:"La aceptación está bloqueada mientras existan fallos críticos no mitigados.",criticalFailures:[...new Set(criticalFailures)]},{status:409});

    const decision=await createVetraDecision({
      proposalId,status:status as "minor_revision"|"major_revision"|"accepted_with_conditions"|"rejected"|"suspended"|"withdrawn",
      quorumSize:reviewerIds.size,rationale,conditions,appealWindowDays,decidedByTamvId:auth.member.tamv_id,
    });
    return NextResponse.json({ok:true,decision:{id:decision.id,proposalCode:proposal.proposal_code,status:decision.decision_status,createdAt:decision.created_at,appealWindowDays},message:"Decisión humana registrada en el historial VETRA. No constituye acreditación externa ni certificación internacional."},{status:201,headers:{"cache-control":"no-store, private"}});
  }catch(error){
    if(error instanceof SupabaseConfigurationError)return NextResponse.json({error:"Supabase no está configurado."},{status:503});
    console.error("VETRA human decision failed");
    return NextResponse.json({error:"No fue posible registrar la decisión. Confirma que la migración VETRA está aplicada y que el RPC transaccional dispone de permisos."},{status:500,headers:{"cache-control":"no-store"}});
  }
}
