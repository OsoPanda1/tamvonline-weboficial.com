import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileCode2, Fingerprint, Globe2, Network, ShieldCheck, Users } from 'lucide-react';

export const metadata = { title: 'Membresía y participación', description: 'Qué ofrece TAMV Online Network y las condiciones reales para participar.' };

const benefits = [
  { icon: Fingerprint, title: 'TAMV ID persistente', text: 'Un identificador interno para resolver la ficha del miembro y enlazar contribuciones declaradas. No sustituye ORCID, ISNI ni DOI.' },
  { icon: FileCode2, title: 'Portafolio trazable', text: 'Una ficha para reunir enlaces a repositorios, publicaciones, áreas de trabajo y materiales que la persona decida compartir.' },
  { icon: Globe2, title: 'Visibilidad con consentimiento', text: 'Perfil privado por defecto. Las fichas públicas se publican solo con consentimiento explícito y tras aprobación manual.' },
  { icon: Network, title: 'Colaboración documentada', text: 'Posibilidad de proponer y descubrir proyectos comunitarios. La participación concreta depende de revisión, disponibilidad y acuerdos de cada proyecto.' },
  { icon: ShieldCheck, title: 'Criterios visibles', text: 'Guías de atribución, documentación, madurez de software, correcciones, licencias y evidencia.' },
  { icon: Users, title: 'Conexión entre disciplinas', text: 'Un espacio de encuentro para personas desarrolladoras, investigadoras y creadoras interesadas en tecnología, memoria y conocimiento abierto.' },
];

export default function MembershipPage() {
  return <main>
    <div className="utility-strip"><span>TAMV ONLINE NETWORK · MARCO DE PARTICIPACIÓN</span><span>TRANSPARENCIA · ATRIBUCIÓN · COLABORACIÓN</span></div>
    <header className="site-header"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><nav className="site-nav"><Link href="/">Institución</Link><Link href="/catalogo">Catálogo</Link><Link href="/privacidad">Privacidad</Link></nav><div className="header-actions"><Link href="/registro" className="button button-small button-primary">Solicitar TAMV ID <ArrowRight aria-hidden="true" /></Link></div></header>
    <section className="legal-page"><div className="legal-container">
      <p className="legal-kicker">01 / MEMBRESÍA Y VALOR</p><h1>Unirse para construir con autoría, método y continuidad.</h1>
      <p>La participación en TAMV Online Network está pensada para personas que deseen hacer su trabajo más descubrible, documentar sus contribuciones y colaborar bajo principios transparentes. La red es una iniciativa independiente en desarrollo; la membresía no representa por sí sola una relación laboral, académica, gubernamental o de representación jurídica.</p>
      <div className="legal-notice"><strong>Promesa responsable:</strong> TAMV ofrece una estructura de identificación y documentación y una vía para presentar contribuciones. No promete empleo, ingresos, becas, financiación, publicación, aceptación de proyectos, acreditación académica ni certificación profesional.</div>
      <h2>Qué obtiene una persona registrada</h2>
      <div className="benefit-grid membership-benefits">{benefits.map(({icon:Icon,title,text},i)=><article key={title}><span>0{i+1}</span><div><h3><Icon aria-hidden="true" /> {title}</h3><p>{text}</p></div></article>)}</div>
      <h2>Qué puede aportar</h2>
      <ul><li>Repositorios, documentación técnica y software cuya licencia y autoría tenga derecho a compartir.</li><li>Materiales de investigación, datos o resultados no confidenciales con sus métodos y limitaciones.</li><li>Correcciones documentales basadas en fuentes primarias verificables.</li><li>Revisión por pares o revisión técnica únicamente cuando la persona haya aceptado expresamente y el proceso esté definido.</li><li>Ideas para proyectos que deberán pasar por una decisión separada de priorización, recursos y gobernanza.</li></ul>
      <h2>Cómo se aprueba la membresía</h2>
      <ol><li>Autentícate mediante Auth0 y verifica el correo electrónico.</li><li>Completa los datos mínimos y acepta el aviso de privacidad y los términos vigentes.</li><li>La base de datos asigna un TAMV ID persistente; la ficha empieza con el estado <strong>pendiente de revisión</strong>.</li><li>La aprobación para figurar como miembro aprobado o resolver una ficha pública requiere una revisión humana posterior.</li></ol>
      <h2>Qué significa el TAMV ID</h2>
      <p>Es un identificador propio de esta plataforma. Se diseña con principios de persistencia, resolución, normalización y conexión con otros identificadores, pero no es un registro oficial de persona, no prueba identidad civil y no tiene el alcance de ORCID, ISNI o DOI. Los identificadores externos se guardan como declarados hasta completar una verificación independiente.</p>
      <h2>Reglas de convivencia y autoría</h2>
      <p>Se espera un trato respetuoso, atribución correcta, licencias compatibles y honestidad respecto a los resultados. No se aceptan publicaciones de datos personales sin base legítima, afiliaciones inventadas, manipulación de métricas ni afirmaciones de certificación sin evidencia.</p>
      <p>Lee también los <Link href="/terminos">Términos de participación</Link>, el <Link href="/privacidad">Aviso de privacidad</Link> y la <Link href="/politica-editorial">Política editorial</Link>.</p>
      <div className="form-actions"><Link className="button button-primary" href="/registro">Solicitar mi TAMV ID <ArrowRight aria-hidden="true" /></Link><Link className="button button-ghost" href="/catalogo">Explorar el catálogo</Link></div>
    </div></section>
    <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>© {new Date().getFullYear()} TAMV Online Network</span><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link></div></div></footer>
  </main>;
}
