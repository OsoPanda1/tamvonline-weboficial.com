import Link from 'next/link';
import RegistrationForm from './registration-form';
import { currentServerSession } from '@/lib/auth0-native';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Registro TAMV ID', description: 'Registro de miembros y solicitud de identificador persistente TAMV ID.' };

export default async function RegistrationPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await currentServerSession();
  const query = await searchParams;
  return <main>
    <div className="utility-strip"><span>IDENTIDAD DIGITAL · REGISTRO DE MIEMBROS</span><span>PRIVACIDAD POR DEFECTO</span></div>
    <header className="site-header"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><nav className="site-nav" aria-label="Navegación"><Link href="/">Inicio</Link><Link href="/membresia">Membresía</Link><Link href="/hcu">HCU Ω∞</Link><Link href="/vetra">VETRA Ω</Link><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link></nav><div className="header-actions"><Link className="button button-small button-ghost" href="/cuenta">Mi cuenta</Link></div></header>
    <section className="form-shell"><div className="form-layout"><aside className="form-intro"><p className="eyebrow">TAMV ID · IDENTIDAD PERSISTENTE</p><h1>Tu trabajo merece una identidad clara.</h1><p>El TAMV ID es un identificador interno persistente para resolver una ficha y conectar contribuciones declaradas. Se inspira en principios de interoperabilidad y estabilidad usados por identificadores como ORCID, ISNI y DOI, pero no los sustituye ni afirma equivalencia institucional.</p><div className="id-principles"><article><strong>01</strong><span>Persistente</span><p>No depende del nombre público ni del correo.</p></article><article><strong>02</strong><span>Privado por defecto</span><p>La publicación requiere consentimiento expreso.</p></article><article><strong>03</strong><span>Verificable por etapas</span><p>Correo, identificadores externos y afiliación son niveles distintos.</p></article></div><div className="role-note">La membresía comienza como pendiente de revisión. La asignación de un TAMV ID no es acreditación académica ni certificación de competencia.</div><div className="form-actions"><Link className="button button-ghost" href="/membresia">Por qué unirse</Link><Link className="button button-ghost" href="/politica-editorial">Criterios editoriales</Link></div></aside>
    <RegistrationForm authenticated={Boolean(session)} name={session?.name || ''} email={session?.email || ''} emailVerified={session?.emailVerified || false} callbackError={query.error} githubConnectionAvailable={Boolean(process.env.AUTH0_GITHUB_CONNECTION?.trim())} orcidConnectionAvailable={Boolean(process.env.AUTH0_ORCID_CONNECTION?.trim())} /></div></section>
    <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>© {new Date().getFullYear()} TAMV Online Network</span><span>Cuenta de identidad: Auth0 · Perfil: Supabase</span><Link href="/privacidad">Aviso de privacidad</Link></div></div></footer>
  </main>;
}
