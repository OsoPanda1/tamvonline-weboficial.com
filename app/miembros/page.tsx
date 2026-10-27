import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CircleAlert, Users } from 'lucide-react';
import { getPublicMembers, SupabaseConfigurationError } from '@/lib/supabase-rest';
import MemberDirectory from './member-directory';

export const dynamic='force-dynamic';
export const metadata={
 title:'Directorio de miembros e investigadores',
 description:'Perfiles públicos consentidos de investigadores y desarrolladores de TAMV Online Network.',
};

export default async function MembersPage(){
 let profiles:Awaited<ReturnType<typeof getPublicMembers>>=[];
 let unavailable=false;
 try{profiles=await getPublicMembers(100);}
 catch(error){unavailable=true;if(!(error instanceof SupabaseConfigurationError))console.error('TAMV public member directory unavailable');}
 return <main className="site-shell">
  <div className="utility-strip"><span>COMUNIDAD DE INVESTIGACIÓN Y DESARROLLO</span><span>TAMV ID · PERFILES CONSENTIDOS</span></div>
  <header className="site-header"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><nav className="site-nav" aria-label="Navegación principal"><Link href="/investigacion">Investigación</Link><Link href="/hcu">HCU Ω∞</Link><Link href="/vetra">VETRA Ω</Link><Link href="/roadmap">Roadmap</Link><Link href="/catalogo">Catálogo</Link></nav><div className="header-actions"><Link className="button button-small button-primary" href="/registro">Unirse a TAMV <ArrowUpRight aria-hidden="true"/></Link></div></header>
  <section className="member-directory-hero"><div className="section-wrap member-directory-hero-inner"><p className="eyebrow"><span className="eyebrow-line"/>TAMV ID · DIRECTORIO PÚBLICO</p><h1>Personas que construyen <em>con evidencia.</em></h1><p>Un punto de encuentro para investigadores, estudiantes y desarrolladores. Los perfiles públicos solo se muestran con aprobación y consentimiento expreso; el directorio no inventa membresías ni atribuye títulos que no estén acreditados por una fuente.</p><div className="member-directory-hero-stats"><span><Users aria-hidden="true"/> {profiles.length} perfiles públicos disponibles</span><span><ShieldCheck aria-hidden="true"/> Privacidad por defecto</span></div></div></section>
  <section className="section-wrap member-directory-section">
   {unavailable?<div className="member-directory-empty"><CircleAlert aria-hidden="true"/><h2>Directorio temporalmente no disponible</h2><p>La base de perfiles públicos no está configurada o no pudo responder. No se muestran datos de reserva ni perfiles ficticios.</p><Link className="button button-ghost" href="/privacidad">Política de privacidad <ArrowRight aria-hidden="true"/></Link></div>:<MemberDirectory profiles={profiles}/>}
  </section>
  <section className="member-directory-join"><div className="section-wrap member-directory-join-inner"><div><p className="eyebrow">COLABORACIÓN LATINOAMERICANA</p><h2>Tu experiencia puede fortalecer una comunidad de investigación abierta.</h2><p>Crear un perfil no certifica competencia ni garantiza publicación; sí establece un punto de contacto que puedes mantener privado o publicar con consentimiento.</p></div><div className="member-directory-join-actions"><Link className="button button-primary" href="/registro">Crear TAMV ID <ArrowRight aria-hidden="true"/></Link><Link className="button button-ghost" href="/politica-editorial">Leer política editorial <ArrowUpRight aria-hidden="true"/></Link></div></div></section>
  <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>Directorio TAMV ID · versión inicial</span><Link href="/privacidad">Privacidad</Link><Link href="/vetra">VETRA Ω</Link><Link href="/hcu">HCU Ω∞</Link><Link href="/">Inicio</Link></div></div></footer>
 </main>;
}
