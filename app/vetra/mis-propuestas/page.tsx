import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CircleAlert, FileText, LockKeyhole } from 'lucide-react';
import { currentServerSession } from '@/lib/auth0-native';
import { getMemberByAuth0Sub, getVetraProposalsForMember, SupabaseConfigurationError, type VetraProposalListItem } from '@/lib/supabase-rest';

export const dynamic = 'force-dynamic';
export const metadata = {
 title: 'Mis propuestas VETRA',
 description: 'Consulta privada de los estados de tus propuestas VETRA.',
 robots: { index: false, follow: false },
};

const statusLabels: Record<string,string> = {
 received: 'Recibida · control administrativo pendiente',
 administrative_screening: 'Control administrativo',
 independent_review: 'En evaluación independiente',
 minor_revision: 'Revisión menor requerida',
 major_revision: 'Revisión mayor requerida',
 accepted_with_conditions: 'Aceptada con condiciones',
 rejected: 'Rechazada con motivos',
 suspended: 'Suspendida',
 withdrawn: 'Retirada',
};
const riskLabels: Record<string,string> = {
 pending: 'Pendiente de evaluación de riesgo',
 low: 'Riesgo bajo según cribado registrado',
 moderate: 'Riesgo moderado según cribado registrado',
 high: 'Riesgo alto; requiere atención reforzada',
 critical: 'Riesgo crítico; revisión y bloqueo según política',
 not_assessed: 'Sin evaluar',
};

export default async function MyVetraProposalsPage() {
 const session = await currentServerSession();
 let member: Awaited<ReturnType<typeof getMemberByAuth0Sub>> = null;
 let proposals: VetraProposalListItem[] = [];
 let unavailable = false;
 if (session) {
   try {
     member = await getMemberByAuth0Sub(session.sub);
     if (member && process.env.TAMV_VETRA_SCHEMA_VERIFIED === 'true' && process.env.TAMV_VETRA_RETENTION_POLICY_APPROVED === 'true') {
       proposals = await getVetraProposalsForMember(member.tamv_id);
     } else if (member) unavailable = true;
   } catch (error) {
     unavailable = true;
     if (!(error instanceof SupabaseConfigurationError)) console.error('VETRA member page lookup failed');
   }
 }
 return <main className="site-shell">
   <div className="utility-strip"><span>ÁREA PRIVADA · VETRA Ω∞</span><span>EXPEDIENTES PERSONALES</span></div>
   <header className="site-header"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><nav className="site-nav"><Link href="/vetra">Protocolo VETRA</Link><Link href="/roadmap">Roadmap</Link><Link href="/membresia">Membresía</Link></nav><div className="header-actions"><Link className="button button-small button-ghost" href="/cuenta">Mi cuenta</Link></div></header>
   <section className="legal-page"><div className="legal-container">
    <p className="legal-kicker">SEGUIMIENTO DE EXPEDIENTES</p><h1>Mis propuestas VETRA</h1>
    <p>Esta vista muestra únicamente el estado de las propuestas vinculadas a tu TAMV ID. No expone dictámenes confidenciales, identidad de revisores ni datos de otros miembros. La recepción de una propuesta no significa que haya sido revisada o aprobada.</p>
    {!session ? <div className="legal-notice"><LockKeyhole aria-hidden="true"/> Inicia sesión con Auth0 para consultar tus expedientes.<div className="form-actions"><a className="button button-primary" href="/api/auth/login?returnTo=%2Fvetra%2Fmis-propuestas">Iniciar sesión <ArrowRight aria-hidden="true"/></a><Link className="button button-ghost" href="/registro">Crear TAMV ID</Link></div></div> :
    !member ? <div className="legal-notice"><CircleAlert aria-hidden="true"/> No hay una ficha TAMV ID vinculada con esta sesión. Completa tu registro antes de enviar una propuesta.<div className="form-actions"><Link className="button button-primary" href="/registro">Completar registro</Link></div></div> :
    unavailable ? <div className="legal-notice"><CircleAlert aria-hidden="true"/> El seguimiento privado no está disponible hasta verificar la migración VETRA 003, los permisos de Supabase y la política de retención aprobada.</div> :
    proposals.length===0 ? <div className="vetra-empty-state"><FileText aria-hidden="true"/><h2>No hay propuestas registradas</h2><p>Cuando la recepción esté habilitada, las propuestas que envíes aparecerán aquí con su referencia y estado.</p><Link className="button button-primary" href="/vetra">Preparar propuesta <ArrowRight aria-hidden="true"/></Link></div> :
    <div className="vetra-own-list">{proposals.map(item=><article key={item.id}><div className="vetra-own-list-top"><span>{item.proposal_code}</span><span>{new Date(item.created_at).toLocaleDateString('es-MX')}</span></div><h2>{item.title}</h2><p>{statusLabels[item.status]||item.status}</p><div className="vetra-own-list-meta"><span>Madurez: {item.maturity_stage}</span><span>Tipo: {item.proposal_type.replaceAll('_',' ')}</span><span>{riskLabels[item.risk_screening_status]||item.risk_screening_status}</span></div></article>)}</div>}
    <div className="form-actions"><Link className="button button-ghost" href="/vetra">Protocolo y filtros <ArrowUpRight aria-hidden="true"/></Link><Link className="button button-ghost" href="/privacidad">Privacidad de expedientes <ArrowUpRight aria-hidden="true"/></Link></div>
    <p className="small-note">La secretaría editorial podrá actualizar estados solo con base en decisiones registradas. La identidad y los comentarios confidenciales de revisores no se muestran en esta página.</p>
   </div></section>
   <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>Área privada TAMV · VETRA Ω∞</span><Link href="/vetra">VETRA</Link><Link href="/">Inicio</Link></div></div></footer>
 </main>;
}
