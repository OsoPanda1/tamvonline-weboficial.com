import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { currentServerSession } from '@/lib/auth0-native';
import { getIdentifiers, getMemberByAuth0Sub, SupabaseConfigurationError } from '@/lib/supabase-rest';
import AccountActions from './account-actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi cuenta TAMV', description: 'Gestión del perfil de miembro y TAMV ID.' };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ orcid?: string }> }) {
  const params = await searchParams;
  const session = await currentServerSession();
  if (!session) return <main><header className="site-header"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><Link className="button button-ghost" href="/registro">Crear cuenta</Link></header><section className="form-shell"><div className="form-intro"><p className="eyebrow">ÁREA PERSONAL</p><h1>Accede a tu TAMV ID.</h1><p>Inicia sesión mediante Auth0 para consultar o actualizar tu ficha.</p><a className="button button-primary" href="/api/auth/login?returnTo=%2Fcuenta">Iniciar sesión</a></div></section></main>;

  let member: Awaited<ReturnType<typeof getMemberByAuth0Sub>> = null;
  let identifiers: Awaited<ReturnType<typeof getIdentifiers>> = [];
  let lookupError = false;
  try {
    member = await getMemberByAuth0Sub(session.sub);
    if (member) identifiers = await getIdentifiers(member.tamv_id);
  } catch (error) {
    lookupError = true;
    if (!(error instanceof SupabaseConfigurationError)) console.error('Unable to load TAMV account');
  }

  return <main>
    <div className="utility-strip"><span>CUENTA DE MIEMBRO</span><span>IDENTIFICADOR PERSISTENTE TAMV</span></div>
    <header className="site-header"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><nav className="site-nav"><Link href="/">Inicio</Link><Link href="/membresia">Membresía</Link><Link href="/comunidad">Comunidad</Link><Link href="/catalogo">Catálogo</Link><Link href="/hcu">HCU Ω∞</Link><Link href="/vetra">VETRA Ω</Link></nav><div className="header-actions"><a className="button button-small button-ghost" href="/api/auth/logout">Cerrar sesión</a></div></header>
    <section className="form-shell"><div className="form-layout"><aside className="form-intro"><p className="eyebrow">MI ESPACIO TAMV</p><h1>Tu identidad. Tu decisión de compartir.</h1><p>La información de tu cuenta no se convierte en perfil público por iniciar sesión. La visibilidad se controla desde la ficha y requiere consentimiento expreso.</p><div className="role-note">Autenticación gestionada por Auth0. Registro de miembros y TAMV ID almacenados en Supabase.</div><div className="form-actions"><Link className="button button-ghost" href="/privacidad">Privacidad</Link><Link className="button button-ghost" href="/terminos">Términos</Link></div></aside>
    <div className="form-panel">
      <p className="eyebrow">PERFIL Y ESTADO</p>
      <h2>{member ? member.display_name : session.name || 'Cuenta autenticada'}</h2>
      <div className="identity-chip"><span className="avatar-dot">{(member?.display_name || session.name || 'T').slice(0,1).toUpperCase()}</span><div><strong>{session.email || 'Correo no disponible'}</strong><small>{session.emailVerified ? 'Correo verificado por Auth0' : 'Correo no verificado'}</small></div></div>

      {params.orcid === 'connected' && <div className="orcid-state-success"><CheckCircle2 aria-hidden="true"/> ORCID autenticado y vinculado a tu TAMV ID. Esta verificación solo acredita el vínculo del identificador, no la afiliación ni la calidad de las publicaciones.</div>}
      {params.orcid && params.orcid !== 'connected' && <div className="form-alert error" role="alert">{params.orcid === 'unconfigured' ? 'La vinculación ORCID aún no está configurada. Registra ORCID_CLIENT_ID, ORCID_CLIENT_SECRET y el callback HTTPS exacto.' : params.orcid === 'cancelled' ? 'Cancelaste la autorización de ORCID; no se realizaron cambios.' : params.orcid === 'exchange_failed' ? 'No se pudo intercambiar el código de autorización con ORCID.' : params.orcid === 'invalid_identity' ? 'ORCID no devolvió un identificador válido.' : params.orcid === 'link_failed' ? 'No se pudo guardar la vinculación. Comprueba la base de datos y si otro perfil ya tiene el ORCID verificado.' : 'No se completó la vinculación ORCID. Inicia el proceso de nuevo o revisa la configuración.'}</div>}
      {lookupError && <div className="form-alert error">No se pudo consultar Supabase. Verifica la configuración de base de datos y la migración.</div>}
      {!member && !lookupError && <div className="form-alert"><strong>Aún no existe una ficha TAMV.</strong><br />Tu identidad Auth0 está activa, pero falta completar el registro y aceptar los documentos de participación y privacidad.</div>}
      {member && <><div className="member-summary"><span className="eyebrow">TAMV ID</span><code>{member.tamv_id}</code><div className="member-meta"><span>Cuenta autenticada</span><span>{member.membership_status === 'pending_review' ? 'Membresía pendiente de revisión' : member.membership_status}</span><span>Perfil {member.profile_visibility === 'public' ? 'público solicitado' : 'privado'}</span></div><p className="subtext">Registrado: {new Date(member.created_at).toLocaleDateString('es-MX', { dateStyle: 'long', timeZone: 'UTC' })}. Última actualización: {new Date(member.updated_at).toLocaleDateString('es-MX', { dateStyle: 'long', timeZone: 'UTC' })}.</p></div>
        <h3 className="minor-heading">Metadatos declarados</h3><dl className="profile-data"><dt>Afiliación</dt><dd>{member.affiliation || 'No declarada'}</dd><dt>País</dt><dd>{member.country_code || 'No declarado'}</dd><dt>Áreas de interés</dt><dd>{member.research_areas.length ? member.research_areas.join(' · ') : 'No declaradas'}</dd><dt>Biografía</dt><dd>{member.bio || 'Sin biografía'}</dd><dt>ORCID / ISNI / enlaces</dt><dd>{identifiers.length ? identifiers.map((item)=>`${item.scheme}: ${item.value} [${item.verification_status}]`).join(' · ') : 'Sin identificadores externos declarados'}</dd></dl>
        {member.membership_status === 'approved' && member.profile_visibility === 'public' && member.public_profile_consent && <p><Link className="inline-link" href={`/miembro/${member.tamv_id}`}>Ver perfil público <span aria-hidden="true">↗</span></Link></p>}
      </>}
      <div className="form-actions"><Link className="button button-primary" href="/registro">{member ? 'Actualizar mi ficha' : 'Completar registro'} <span aria-hidden="true">↗</span></Link></div>
      <AccountActions orcidLinkEnabled={Boolean(process.env.ORCID_CLIENT_ID?.trim() && process.env.ORCID_CLIENT_SECRET?.trim())} orcidVerified={identifiers.some(item => item.scheme === "ORCID" && item.verification_status === "verified")} />
    </div></div></section>
    <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>© {new Date().getFullYear()} TAMV Online Network</span><span>La verificación de correo no equivale a verificación de identidad civil.</span><Link href="/privacidad">Aviso de privacidad</Link></div></div></footer>
  </main>;
}
