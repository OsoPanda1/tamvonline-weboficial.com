import SiteHeader from '@/app/components/site-header';
import Link from 'next/link';
import RegistrationForm from './registration-form';
import { currentServerSession, openPayload } from '@/lib/auth0-native';
import { cookies } from 'next/headers';
import { getIdentifiers, getMemberByAuth0Sub, SupabaseConfigurationError } from '@/lib/supabase-rest';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Registro TAMV ID', description: 'Registro de miembros y solicitud de identificador persistente TAMV ID.' };

type PendingOrcid = { orcid: string; createdAt: number; returnTo: string };
const pendingOrcidCookieName = () => process.env.NODE_ENV === 'production' ? '__Host-tamv_orcid_pending' : 'tamv_orcid_pending';

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ error?: string; orcid?: string }> }) {
  const session = await currentServerSession();
  const query = await searchParams;
  const cookieStore = await cookies();
  const pendingCookie = cookieStore.get(pendingOrcidCookieName())?.value;
  const pending = openPayload<PendingOrcid>(pendingCookie);
  const pendingOrcid = pending && Date.now() - pending.createdAt >= 0 && Date.now() - pending.createdAt <= 30 * 60 * 1000
    && /^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(pending.orcid)
    ? pending.orcid : '';
  let existingMember: Awaited<ReturnType<typeof getMemberByAuth0Sub>> = null;
  let existingIdentifiers: Awaited<ReturnType<typeof getIdentifiers>> = [];
  if (session) {
    try {
      existingMember = await getMemberByAuth0Sub(session.sub);
      if (existingMember) existingIdentifiers = await getIdentifiers(existingMember.tamv_id);
    } catch (error) {
      if (!(error instanceof SupabaseConfigurationError)) console.error('TAMV registration profile prefill failed');
    }
  }
  return <main>
    <div className="utility-strip"><span>IDENTIDAD DIGITAL · REGISTRO DE MIEMBROS</span><span>PRIVACIDAD POR DEFECTO</span></div>
    <SiteHeader active="/registro" />
    <section className="form-shell"><div className="form-layout"><aside className="form-intro"><p className="eyebrow">TAMV ID · IDENTIDAD PERSISTENTE</p><h1>Tu trabajo merece una identidad clara.</h1><p>El TAMV ID es un identificador interno persistente para resolver una ficha y conectar contribuciones declaradas. Se inspira en principios de interoperabilidad y estabilidad usados por identificadores como ORCID, ISNI y DOI, pero no los sustituye ni afirma equivalencia institucional.</p><div className="id-principles"><article><strong>01</strong><span>Persistente</span><p>No depende del nombre público ni del correo.</p></article><article><strong>02</strong><span>Privado por defecto</span><p>La publicación requiere consentimiento expreso.</p></article><article><strong>03</strong><span>Verificable por etapas</span><p>Correo, identificadores externos y afiliación son niveles distintos.</p></article></div><div className="role-note">La membresía comienza como pendiente de revisión. La asignación de un TAMV ID no es acreditación académica ni certificación de competencia.</div><div className="form-actions"><Link className="button button-ghost" href="/membresia">Por qué unirse</Link><Link className="button button-ghost" href="/politica-editorial">Criterios editoriales</Link></div></aside>
    <RegistrationForm authenticated={Boolean(session)} name={session?.name || ''} email={session?.email || ''} emailVerified={session?.emailVerified || false} callbackError={query.error} githubConnectionAvailable={Boolean(process.env.AUTH0_GITHUB_CONNECTION?.trim())} orcidConnectionAvailable={Boolean(process.env.AUTH0_ORCID_CONNECTION?.trim())}
      orcidOAuthConfigured={Boolean(process.env.ORCID_CLIENT_ID?.trim() && process.env.ORCID_CLIENT_SECRET?.trim())}
      pendingOrcid={pendingOrcid}
      initialProfile={existingMember ? {
        displayName: existingMember.display_name, bio: existingMember.bio || '', affiliation: existingMember.affiliation || '',
        countryCode: existingMember.country_code || 'MX', researchAreas: existingMember.research_areas,
        visibility: existingMember.profile_visibility, publicProfileConsent: existingMember.public_profile_consent,
        termsVersion: existingMember.terms_version, privacyVersion: existingMember.privacy_version,
      } : null}
      initialIdentifiers={existingIdentifiers.map(item=>({scheme:item.scheme,value:item.value,verificationStatus:item.verification_status}))}
    /></div></section>
    <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>© {new Date().getFullYear()} TAMV Online Network</span><span>Cuenta de identidad: Auth0 · Perfil: Supabase</span><Link href="/privacidad">Aviso de privacidad</Link></div></div></footer>
  </main>;
}
