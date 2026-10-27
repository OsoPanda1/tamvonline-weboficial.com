import SiteHeader from '@/app/components/site-header';
import Link from 'next/link';
import { ArrowUpRight, CircleAlert, LockKeyhole } from 'lucide-react';
import { currentServerSession } from '@/lib/auth0-native';
import { getMemberByAuth0Sub, getVetraReviewQueue, getVetraLatestReviewsForDecision, SupabaseConfigurationError } from '@/lib/supabase-rest';
import DecisionConsole from './decision-console';

export const dynamic='force-dynamic';
export const metadata={title:'Consola de decisiones VETRA',description:'Área privada para resoluciones humanas VETRA Ω∞.',robots:{index:false,follow:false}};

function enabled():boolean{
 return process.env.TAMV_VETRA_DECISION_CONSOLE_ENABLED==='true'
  && process.env.TAMV_VETRA_GOVERNANCE_APPROVED==='true'
  && process.env.TAMV_VETRA_SCHEMA_VERIFIED==='true'
  && process.env.TAMV_VETRA_RETENTION_POLICY_APPROVED==='true'
  && Boolean(process.env.TAMV_DATA_CONTROLLER_NAME?.trim())
  && Boolean(process.env.TAMV_DATA_CONTROLLER_ADDRESS?.trim())
  && Boolean(process.env.TAMV_PRIVACY_CONTACT_EMAIL?.trim());
}
function allowlisted(email:string|null|undefined):boolean{
 return Boolean(email)&&new Set((process.env.TAMV_VETRA_DECISION_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)).has(email!.toLowerCase());
}

export default async function VetraDecisionPage(){
 const session=await currentServerSession();
 let member:Awaited<ReturnType<typeof getMemberByAuth0Sub>>=null;
 let items:Array<{proposal:Awaited<ReturnType<typeof getVetraReviewQueue>>[number];reviews:Awaited<ReturnType<typeof getVetraLatestReviewsForDecision>>}>=[];
 let ready=enabled(),loadFailed=false;
 if(ready&&session?.emailVerified&&allowlisted(session.email)){
  try{
   member=await getMemberByAuth0Sub(session.sub);
   if(member?.membership_status==='approved'&&member.email_verified){
    const queue=await getVetraReviewQueue(40);
    items=await Promise.all(queue.map(async proposal=>({proposal,reviews:await getVetraLatestReviewsForDecision(proposal.id)})));
   }else member=null;
  }catch(error){loadFailed=true;if(!(error instanceof SupabaseConfigurationError))console.error('VETRA decision console failed to load');}
 }
 return <main className="site-shell">
  <div className="utility-strip"><span>ÁREA PRIVADA · VETRA Ω∞</span><span>DECISIÓN HUMANA · QUÓRUM</span></div>
  <SiteHeader active="/vetra" />
  <section className="legal-page"><div className="legal-container"><p className="legal-kicker">CONSEJO DE EVALUACIÓN · SECRETARÍA</p><h1>Consola de decisiones VETRA</h1><p>Esta consola es una función interna para responsables de decisión expresamente autorizados. Exige revisiones independientes, cobertura de los catorce dominios, declaración de conflictos y motivación trazable.</p>
   {!ready?<div className="legal-notice"><LockKeyhole aria-hidden="true"/> La consola está deshabilitada hasta que la gobernanza, la privacidad, la retención y la base estén aprobadas.</div>
   :!session?<div className="legal-notice"><LockKeyhole aria-hidden="true"/> Inicia sesión con Auth0 para verificar autorización.<div className="form-actions"><a className="button button-primary" href="/api/auth/login?returnTo=%2Fvetra%2Fdecision">Iniciar sesión <ArrowUpRight aria-hidden="true"/></a></div></div>
   :!session.emailVerified||!allowlisted(session.email)?<div className="legal-notice"><CircleAlert aria-hidden="true"/> Esta cuenta no está autorizada para emitir decisiones VETRA. La función no permite autoasignar privilegios.</div>
   :!member?<div className="legal-notice"><CircleAlert aria-hidden="true"/> El responsable de decisión requiere TAMV ID aprobado y correo verificado.</div>
   :loadFailed?<div className="legal-notice"><CircleAlert aria-hidden="true"/> No fue posible acceder a los expedientes para decisión. Comprueba Supabase y la migración 003.</div>
   :<><div className="vetra-review-privacy-note"><LockKeyhole aria-hidden="true"/><p><strong>Control de independencia.</strong> El responsable de decisión no puede haber revisado esta propuesta. El registro final exige tres personas revisoras distintas, declaración de independencia, cobertura de los catorce dominios y condiciones explícitas. La base repite los controles críticos en una operación transaccional.</p></div><DecisionConsole initialItems={items}/></>}
  </div></section>
  <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>VETRA Ω∞ · Decisiones confidenciales</span><Link href="/politica-editorial">Política editorial</Link><Link href="/vetra">Protocolo</Link></div></div></footer>
 </main>;
}
