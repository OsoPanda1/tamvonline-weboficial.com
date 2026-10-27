import Link from 'next/link';
import { ArrowUpRight, CircleAlert, LockKeyhole } from 'lucide-react';
import { currentServerSession } from '@/lib/auth0-native';
import { getMemberByAuth0Sub, getVetraReviewQueue, SupabaseConfigurationError } from '@/lib/supabase-rest';
import ReviewerConsole from './reviewer-console';

export const dynamic='force-dynamic';
export const metadata={title:'Consola privada de revisión VETRA',description:'Área de revisión independiente de propuestas VETRA Ω∞.',robots:{index:false,follow:false}};

function enabled():boolean{
 return process.env.TAMV_VETRA_REVIEW_CONSOLE_ENABLED==='true'
  && process.env.TAMV_VETRA_GOVERNANCE_APPROVED==='true'
  && process.env.TAMV_VETRA_SCHEMA_VERIFIED==='true'
  && process.env.TAMV_VETRA_RETENTION_POLICY_APPROVED==='true'
  && Boolean(process.env.TAMV_DATA_CONTROLLER_NAME?.trim())
  && Boolean(process.env.TAMV_DATA_CONTROLLER_ADDRESS?.trim())
  && Boolean(process.env.TAMV_PRIVACY_CONTACT_EMAIL?.trim());
}
function allowed(email:string|null|undefined):boolean{
 return Boolean(email)&&new Set((process.env.TAMV_VETRA_REVIEWER_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)).has(email!.toLowerCase());
}
function decisionAllowed(email:string|null|undefined):boolean{
 return Boolean(email)&&new Set((process.env.TAMV_VETRA_DECISION_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)).has(email!.toLowerCase());
}

export default async function VetraReviewerPage(){
 const session=await currentServerSession();
 let ready=enabled();
 let member:Awaited<ReturnType<typeof getMemberByAuth0Sub>>=null;
 let items:Awaited<ReturnType<typeof getVetraReviewQueue>>=[];
 let loadFailed=false;
 if(ready&&session?.emailVerified&&allowed(session.email)){
  try{
   member=await getMemberByAuth0Sub(session.sub);
   if(member?.membership_status==='approved'&&member.email_verified) items=await getVetraReviewQueue(40);
   else member=null;
  }catch(error){loadFailed=true;if(!(error instanceof SupabaseConfigurationError))console.error('VETRA reviewer console failed to load');}
 }
 return <main className="site-shell">
  <div className="utility-strip"><span>ÁREA PRIVADA · VETRA Ω∞</span><span>REVISIÓN HUMANA INDEPENDIENTE</span></div>
  <header className="site-header"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><nav className="site-nav"><Link href="/vetra">Protocolo VETRA</Link><Link href="/vetra/mis-propuestas">Mis propuestas</Link><Link href="/roadmap">Roadmap</Link></nav><div className="header-actions"><Link className="button button-small button-ghost" href="/cuenta">Mi cuenta</Link></div></header>
  <section className="legal-page"><div className="legal-container"><p className="legal-kicker">SECRETARÍA EDITORIAL · COLA DE EVALUACIÓN</p><h1>Consola de revisión VETRA</h1><p>Esta consola contiene propuestas no públicas. Accede únicamente si fuiste designado formalmente, tu competencia fue revisada y no existe conflicto. No descargues ni compartas expedientes fuera del proceso autorizado.</p>
   {!ready?<div className="legal-notice"><LockKeyhole aria-hidden="true"/> <strong>Consola deshabilitada.</strong> Para habilitarla se requiere política de gobernanza aprobada, migración verificada, política de retención, aviso de privacidad y configuración de acceso de revisores.</div>
   :!session?<div className="legal-notice"><LockKeyhole aria-hidden="true"/> Inicia sesión con Auth0 para comprobar tu autorización de revisión.<div className="form-actions"><a className="button button-primary" href="/api/auth/login?returnTo=%2Fvetra%2Frevision">Iniciar sesión <ArrowUpRight aria-hidden="true"/></a></div></div>
   :!session.emailVerified||!allowed(session.email)?<div className="legal-notice"><CircleAlert aria-hidden="true"/> Esta cuenta no está autorizada para revisar. La habilitación debe ser asignada por la gobernanza VETRA; no se puede solicitar ni aprobar desde este formulario.</div>
   :!member?<div className="legal-notice"><CircleAlert aria-hidden="true"/> La cuenta no tiene un TAMV ID aprobado. La consola requiere una ficha de miembro aprobada además de la autorización explícita por correo.</div>
   :loadFailed?<div className="legal-notice"><CircleAlert aria-hidden="true"/> No fue posible cargar la cola privada. Verifica el estado de Supabase y la migración VETRA.</div>
   :<><div className="vetra-review-privacy-note"><LockKeyhole aria-hidden="true"/><p><strong>Confidencialidad y límites.</strong> El acceso demuestra autorización de aplicación, no por sí mismo credenciales académicas. Solo deben estar en la lista de acceso personas designadas tras verificación de competencia/conflictos. Los informes deben justificar cada nota con evidencia. Los modelos de IA pueden apoyar la lectura, pero no emiten decisiones finales.</p></div><ReviewerConsole initialItems={items}/>{decisionAllowed(session.email)&&<div className="form-actions"><Link className="button button-primary" href="/vetra/decision">Abrir consola de decisiones <ArrowUpRight aria-hidden="true"/></Link></div>}</>}
  </div></section>
  <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>VETRA Ω∞ · Revisión confidencial</span><Link href="/politica-editorial">Política editorial</Link><Link href="/vetra">Protocolo</Link></div></div></footer>
 </main>;
}
