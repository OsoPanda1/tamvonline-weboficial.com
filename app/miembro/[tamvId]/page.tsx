import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicMember, SupabaseConfigurationError } from '@/lib/supabase-rest';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function generateMetadata({ params }: { params: Promise<{ tamvId: string }> }) {
  const { tamvId } = await params;
  return { title: `Perfil ${tamvId}`, description: 'Resolución pública de TAMV ID.' };
}

export default async function PublicMemberPage({ params }: { params: Promise<{ tamvId: string }> }) {
  const { tamvId: rawId } = await params;
  const tamvId = rawId.toUpperCase();
  if (!/^TAMV-[0-9A-F]{26}$/.test(tamvId)) notFound();
  let member: Awaited<ReturnType<typeof getPublicMember>> = null;
  let unavailable = false;
  try { member = await getPublicMember(tamvId); }
  catch (error) {
    if (error instanceof SupabaseConfigurationError) unavailable = true;
    else { console.error('Public TAMV ID resolution failed'); unavailable = true; }
  }
  if (!member && !unavailable) notFound();
  return <main>
    <div className="utility-strip"><span>RESOLVED IDENTITY RECORD</span><span>TAMV ONLINE NETWORK</span></div>
    <header className="site-header"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><nav className="site-nav"><Link href="/membresia">Membresía</Link><Link href="/catalogo">Catálogo</Link><Link href="/privacidad">Privacidad</Link></nav></header>
    <section className="form-shell"><div className="member-profile-hero">
      <p className="eyebrow">TAMV ID · FICHA PÚBLICA</p>
      {unavailable ? <><h1>El resolver no está disponible.</h1><p>La base de datos no se pudo consultar. Inténtalo más tarde o regresa al sitio institucional.</p></> : <><div className="member-id">{member!.tamv_id}</div><h1>{member!.display_name}</h1><p>Ficha pública aprobada por TAMV. La inclusión aquí no equivale a verificación de identidad civil, acreditación académica, aval de afiliación o evaluación independiente.</p><div className="profile-data"><strong>Biografía</strong><span>{member!.bio || 'Sin biografía pública.'}</span><strong>Afiliación declarada</strong><span>{member!.affiliation || 'No declarada'}</span><strong>País / territorio</strong><span>{member!.country_code || 'No declarado'}</span><strong>Áreas de trabajo</strong><span>{member!.research_areas?.length ? member!.research_areas.join(' · ') : 'No declaradas'}</span><strong>Identificadores y enlaces</strong><span>{member!.identifiers.length ? member!.identifiers.map((id) => `${id.scheme}: ${id.value} (${id.verification_status})`).join(' · ') : 'Sin enlaces declarados'}</span></div><p className="small-note">Los identificadores externos figuran como declarados salvo que el estado indique explícitamente verificado. La vigencia del perfil y las obras vinculadas debe comprobarse en sus fuentes originales.</p></>}
      <div className="form-actions"><Link className="button button-primary" href="/registro">Solicitar mi TAMV ID</Link><Link className="button button-ghost" href="/catalogo">Consultar catálogo</Link></div>
    </div></section>
    <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>Una ficha pública TAMV · No representa acreditación de terceros</span><Link href="/privacidad">Privacidad</Link><Link href="/">Inicio</Link></div></div></footer>
  </main>;
}
