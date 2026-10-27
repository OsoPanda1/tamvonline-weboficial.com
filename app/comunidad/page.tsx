import SiteHeader from '@/app/components/site-header';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpenCheck, ShieldCheck, Users } from 'lucide-react';
import { getPublicMembers, SupabaseConfigurationError } from '@/lib/supabase-rest';
import CommunityDirectory from './community-directory';

export const dynamic='force-dynamic';
export const metadata={
 title:'Comunidad de investigación y desarrollo',
 description:'Directorio de perfiles públicos de investigación y desarrollo de TAMV Online Network, con consentimiento explícito y enlaces de identificadores verificados.',
 openGraph:{title:'Comunidad TAMV Online Network',description:'Personas, investigación aplicada, software y colaboración latinoamericana.',type:'website'},
};

export default async function CommunityPage(){
 let profiles:Awaited<ReturnType<typeof getPublicMembers>>=[];
 let loadError=false;
 try{profiles=await getPublicMembers(100);}
 catch(error){loadError=true;if(!(error instanceof SupabaseConfigurationError))console.error('TAMV public community directory unavailable');}
 return <main className="site-shell">
  <div className="utility-strip"><span>COMUNIDAD TAMV</span><span>INVESTIGACIÓN / SOFTWARE / CIENCIA ABIERTA</span><span>PRIVACIDAD POR DEFECTO</span></div>
  <SiteHeader active="/comunidad" />
  <section className="community-hero"><div className="section-wrap community-hero-grid"><div><p className="eyebrow"><span className="eyebrow-line"/>PERSONAS · CONTRIBUCIONES · PROCEDENCIA</p><h1>La investigación avanza <em>en comunidad.</em></h1><p>Un directorio de miembros que han decidido publicar su perfil. Busca por áreas, conoce intereses y explora identificadores externos que hayan sido verificados mediante el flujo correspondiente.</p><div className="community-hero-stats"><span><Users aria-hidden="true"/><strong>{profiles.length}</strong><small>perfiles públicos disponibles en esta consulta</small></span><span><ShieldCheck aria-hidden="true"/><strong>Consentimiento</strong><small>requisito para aparecer en el directorio</small></span><span><BookOpenCheck aria-hidden="true"/><strong>VETRA Ω∞</strong><small>reglas de evidencia para propuestas</small></span></div></div><aside className="community-hero-panel"><span className="eyebrow">REGLAS DEL DIRECTORIO</span><h2>La visibilidad es una elección.</h2><ul><li>Solo fichas aprobadas y expresamente públicas.</li><li>El correo y los identificadores internos no se muestran.</li><li>Los enlaces verificados se distinguen de los datos declarados.</li><li>El perfil no equivale a afiliación académica acreditada.</li></ul><Link className="inline-link" href="/privacidad">Leer aviso de privacidad <ArrowRight aria-hidden="true"/></Link></aside></div></section>
  <section className="section-wrap community-directory-section"><div className="section-heading-row"><div><p className="eyebrow">DIRECTORIO PÚBLICO</p><h2>Encuentra una línea de trabajo <em>o una colaboración.</em></h2></div><p>Este catálogo no rellena espacios con personas ficticias. Si no hay perfiles públicos disponibles, la página lo indica y permite iniciar un registro real.</p></div><CommunityDirectory profiles={profiles} loadError={loadError}/></section>
  <section className="community-join-section"><div className="section-wrap community-join-inner"><div><p className="eyebrow">PARTICIPACIÓN ABIERTA</p><h2>Comparte tu perfil <em>bajo tus propias condiciones.</em></h2><p>Registra un TAMV ID, declara tus áreas de trabajo y decide si quieres publicar la ficha. Puedes vincular identificadores externos; las declaraciones manuales no se marcan como verificadas.</p></div><div className="hero-buttons"><Link className="button button-primary" href="/registro">Crear perfil TAMV <ArrowRight aria-hidden="true"/></Link><Link className="button button-ghost" href="/vetra">Conocer los filtros VETRA Ω∞ <ArrowUpRight aria-hidden="true"/></Link></div></div></section>
  <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>Directorio de comunidad · TAMV Online Network</span><Link href="/politica-editorial">Política editorial</Link><Link href="/privacidad">Privacidad</Link><Link href="/vetra">VETRA Ω∞</Link><Link href="/">Inicio</Link></div></div></footer>
 </main>;
}
