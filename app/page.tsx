import Link from 'next/link'
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Boxes, Code2, Compass,
  FileCheck2, Fingerprint, Globe2, Landmark, ShieldCheck, Sparkles, Users,
} from 'lucide-react'

const officialLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TAMVONLINE-OFICIAL-Id1lguzYc8qoEFd5VTU26wdHKq3Rj2.jpg'

const focusAreas = [
  { n: '01', icon: Compass, title: 'Memoria territorial y cultura', text: 'Herramientas para documentar patrimonio, relatos locales, capacidades comunitarias y conocimiento situado.' },
  { n: '02', icon: Code2, title: 'Software e infraestructura abierta', text: 'Diseño de plataformas, interoperabilidad, documentación, versiones y prácticas técnicas reproducibles.' },
  { n: '03', icon: Sparkles, title: 'Inteligencia artificial responsable', text: 'Asistentes, orquestación de modelos, límites de autoridad, evaluación y supervisión humana.' },
  { n: '04', icon: BookOpen, title: 'Investigación y ciencia abierta', text: 'Organización de fuentes, métodos, resultados, identificadores y artefactos digitales citables.' },
]

const benefits = [
  ['Identidad persistente', 'Un TAMV ID propio que no depende del nombre visible y permite resolver el perfil público cuando la persona decide publicarlo.'],
  ['Atribución y portafolio', 'Una ficha para conectar repositorios, publicaciones, versiones, contribuciones y otros identificadores declarados.'],
  ['Visibilidad con control', 'El perfil nace privado. Cada miembro decide qué datos biográficos y enlaces desea hacer públicos.'],
  ['Colaboración por proyectos', 'Una vía para proponer iniciativas, localizar perfiles afines y registrar contribuciones documentadas. La participación depende de cada proyecto.'],
  ['Prácticas abiertas', 'Guías, recursos, convenciones de documentación y criterios explícitos para distinguir conceptos, prototipos y resultados.'],
  ['Trayectoria portable', 'Enlaces a ORCID, DOI, ISNI u otros registros cuando correspondan, sin sustituirlos ni apropiarse de su autoridad.'],
]

const validationSteps = [
  ['Procedencia', 'Quién creó el artefacto, de dónde proviene, qué versión se examinó y qué licencia se declara.'],
  ['Validación técnica', 'Pruebas, instrucciones reproducibles, alcance de la evaluación, entorno y fallos conocidos.'],
  ['Revisión independiente', 'Solo se marca cuando existe evidencia identificable de revisión externa; no se infiere de una publicación o un DOI.'],
  ['Afirmaciones e impacto', 'Las cifras requieren método, periodo, fuente y limitaciones. Si son autodeclaradas, se etiquetan como tales.'],
]

export default function HomePage() {
  return (
    <main className="site-shell">
      <div className="utility-strip">
        <span>INICIATIVA MEXICANA INDEPENDIENTE</span>
        <span>MINERAL DEL MONTE · HIDALGO · MÉXICO</span>
        <span>INVESTIGACIÓN / TECNOLOGÍA / MEMORIA</span>
      </div>

      <header className="site-header">
        <Link className="brand-lockup" href="/" aria-label="TAMV Online Network, inicio">
          <span className="brand-monogram">T</span>
          <span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span>
        </Link>
        <nav className="site-nav" aria-label="Navegación principal">
          <a href="#institucion">Institución</a>
          <a href="#lineas">Líneas de trabajo</a>
          <a href="#validacion">Validación</a>
          <Link href="/membresia">Membresía</Link>
          <Link href="/catalogo">Catálogo</Link><Link href="/investigacion">Investigación</Link><Link href="/resolver">Resolver TAMV ID</Link><Link href="/auditoria">Auditoría e IP</Link><Link href="/vetra">VETRA Ω</Link><Link href="/roadmap">Roadmap</Link><Link href="/hcu">HCU Ω∞</Link>
        </nav>
        <div className="header-actions">
          <Link className="header-login" href="/cuenta">Acceder</Link>
          <Link className="button button-small button-primary" href="/registro">Obtener TAMV ID <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </header>

      <section className="hero-section" id="inicio">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" />CONOCIMIENTO CON CONTEXTO · TECNOLOGÍA CON RESPONSABILIDAD</p>
          <h1>La memoria del futuro se <em>construye en común.</em></h1>
          <p className="hero-lead">TAMV Online Network conecta personas, ideas, sistemas digitales y conocimiento territorial para documentar el trabajo tecnológico desde México y Latinoamérica.</p>
          <div className="hero-buttons">
            <Link className="button button-primary" href="/membresia">Conoce la red <ArrowRight aria-hidden="true" /></Link>
            <Link className="button button-ghost" href="/registro">Únete y crea tu TAMV ID <ArrowUpRight aria-hidden="true" /></Link>
          </div>
          <div className="hero-principles">
            <span><ShieldCheck aria-hidden="true" /> Evidencia explícita</span>
            <span><Fingerprint aria-hidden="true" /> Identidad portable</span>
            <span><Globe2 aria-hidden="true" /> Colaboración abierta</span>
          </div>
        </div>
        <aside className="hero-identity">
          <div className="logo-frame"><img src={officialLogo} alt="Logotipo oficial de TAMV Online Network" /></div>
          <div className="identity-caption"><span>01 / IDENTIDAD</span><p>Preservar aquello que las personas consideran digno de ser recordado.</p></div>
          <div className="identity-orbit orbit-one" /><div className="identity-orbit orbit-two" />
        </aside>
      </section>

      <section className="institution-section section-wrap" id="institucion">
        <div className="section-aside"><span className="section-number">01 — IDENTIDAD</span><span className="aside-rule" /><span className="aside-note">Un proyecto en evolución</span></div>
        <div className="institution-main">
          <p className="eyebrow">QUIÉNES SOMOS</p>
          <h2>Una red independiente para convertir <em>ideas en trabajo documentado.</em></h2>
          <p className="body-large">TAMV Online Network es una iniciativa mexicana de investigación y desarrollo que busca articular tecnología, memoria territorial, colaboración creativa y prácticas de conocimiento abierto.</p>
          <p className="body-copy">Su identidad se construye mediante proyectos, fuentes consultables, software, documentación y relaciones de colaboración explícitas. La denominación TAMV Online Network describe la iniciativa y no constituye por sí sola una afirmación de personalidad jurídica, acreditación académica, respaldo gubernamental ni afiliación a terceros.</p>
          <div className="mission-vision-grid">
            <article><span>MISIÓN</span><h3>Conectar, documentar, preservar.</h3><p>Facilitar que desarrolladores, investigadores, creadores y comunidades organicen sus aportaciones y colaboren con trazabilidad, criterios éticos y respeto por la autoría.</p></article>
            <article><span>VISIÓN</span><h3>Conocimiento latinoamericano que perdura.</h3><p>Construir una infraestructura interoperable donde las contribuciones puedan identificarse, consultarse, evolucionar y permanecer vinculadas con sus autores.</p></article>
          </div>
          <div className="values-row"><span>Valores</span><b>Integridad</b><b>Accesibilidad</b><b>Interoperabilidad</b><b>Responsabilidad</b><b>Memoria viva</b></div>
        </div>
      </section>

      <section className="focus-section" id="lineas">
        <div className="section-wrap">
          <div className="section-heading-row"><div><p className="eyebrow">02 — QUÉ HACEMOS</p><h2>Cuatro líneas, <em>un propósito compartido.</em></h2></div><p>La agenda combina investigación aplicada, desarrollo de sistemas y preservación de conocimiento. Cada proyecto debe publicar su propio alcance y nivel de madurez.</p></div>
          <div className="focus-grid">{focusAreas.map(({ n, icon: Icon, title, text }) => <article className="focus-card" key={n}><div className="focus-card-top"><span>{n}</span><Icon aria-hidden="true" /></div><h3>{title}</h3><p>{text}</p><span className="card-bottom-line" /></article>)}</div>
          <div className="focus-footnote"><span>ALCANCE DECLARADO</span><p>Estas líneas describen objetivos de trabajo. No implican que todas las funciones estén implementadas, desplegadas, arbitradas o certificadas.</p></div>
        </div>
      </section>

      <section className="founder-section section-wrap" id="fundador">
        <div className="founder-art founder-portrait-frame"><img className="founder-portrait" src="/edwin-oswaldo-castillo-trejo.webp" alt="Fotografía pública de Edwin Oswaldo Castillo Trejo, fundador de TAMV Online Network" loading="lazy" /><div className="founder-photo-overlay" aria-hidden="true"></div><div className="founder-art-caption">EDWIN OSWALDO CASTILLO TREJO · FUNDADOR</div><span className="founder-photo-credit">Fotografía publicada en el portal TAMV</span></div>
        <div className="founder-copy"><p className="eyebrow">03 — FUNDADOR E IMPULSOR</p><h2>Edwin Oswaldo Castillo Trejo <em>· Anubis Villaseñor</em></h2><p className="body-large">Impulsor de TAMV Online Network y de una visión que relaciona tecnología, identidad digital, memoria territorial y colaboración latinoamericana.</p><p className="body-copy">Anubis Villaseñor es la firma creativa asociada públicamente a Edwin Oswaldo Castillo Trejo. La presentación institucional busca hacer visible la autoría y trayectoria pública del proyecto, sin atribuir títulos, afiliaciones, premios ni validaciones que no hayan sido comprobados en fuentes primarias.</p><div className="founder-identifier-grid"><a href="https://orcid.org/0009-0008-5050-1539" target="_blank" rel="noopener noreferrer"><span>ORCID</span><strong>0009-0008-5050-1539</strong><ArrowUpRight aria-hidden="true" /></a><a href="https://isni.org/isni/0000000531699229" target="_blank" rel="noopener noreferrer"><span>ISNI</span><strong>0000 0005 3169 9229</strong><ArrowUpRight aria-hidden="true" /></a></div><div className="founder-links"><a href="https://portafolio-edwin.lovable.app/" target="_blank" rel="noopener noreferrer">Portafolio profesional <ArrowUpRight aria-hidden="true" /></a><a href="https://www.researchgate.net/profile/Edwin-Oswaldo-Castillo-Trejo" target="_blank" rel="noopener noreferrer">ResearchGate <ArrowUpRight aria-hidden="true" /></a><a href="https://www.linkedin.com/in/edwin-oswaldo-castillo-aka-anubis-villase%C3%B1or-69a847376/" target="_blank" rel="noopener noreferrer">LinkedIn <ArrowUpRight aria-hidden="true" /></a><a href="https://github.com/OsoPanda1" target="_blank" rel="noopener noreferrer">Repositorios <ArrowUpRight aria-hidden="true" /></a><a href="/investigacion">Publicaciones y presencia pública <ArrowUpRight aria-hidden="true" /></a></div></div>
      </section>

      <section className="proof-section" id="validacion"><div className="section-wrap">
        <div className="section-heading-row"><div><p className="eyebrow">04 — CÓMO LO VALIDAMOS</p><h2>La confianza no se anuncia. <em>Se demuestra.</em></h2></div><p>Un marco de evidencia para hacer explícito qué se conoce, qué se probó, quién lo revisó y qué sigue pendiente.</p></div>
        <div className="validation-list">{validationSteps.map(([title, text], i) => <article key={title}><span className="validation-index">0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div><BadgeCheck aria-hidden="true" /></article>)}</div>
        <div className="status-legend"><span className="legend-title">ESTADOS DE MADUREZ</span><span>Propuesto</span><span>En desarrollo</span><span>Prototipo</span><span>Probado</span><span>Desplegado</span><span>Evaluado externamente</span></div>
        <p className="small-note">Un identificador persistente ayuda a resolver un registro; no certifica identidad civil, competencia, calidad científica o afiliación. TAMV documentará cada afirmación según su evidencia disponible.</p>
      </div></section>

      <section className="audit-teaser"><div className="section-wrap audit-teaser-inner"><div><p className="eyebrow">INVESTIGACIÓN · PROPIEDAD INTELECTUAL · ISABELLA</p><h2>Del registro público a un expediente trazable.</h2><p>Búsqueda federada, cotejo de DOI, mapa de APIs y revisión preliminar de anterioridad con límites explícitos de evidencia.</p></div><Link className="button button-primary" href="/auditoria">Abrir motor de evidencia <ArrowRight aria-hidden="true" /></Link></div></section>

      <section className="audit-teaser"><div className="section-wrap audit-teaser-inner"><div><p className="eyebrow">EVALUACIÓN · GOBERNANZA · CIENCIA ABIERTA</p><h2>Una propuesta pasa por evidencia, método y responsabilidad.</h2><p>Conoce los tres filtros VETRA Ω∞ y el roadmap para consolidar investigación, Isabella y una comunidad sostenible.</p></div><Link className="button button-primary" href="/vetra">Explorar VETRA Ω∞ <ArrowRight aria-hidden="true" /></Link></div></section>

      <section className="audit-teaser hcu-home-teaser"><div className="section-wrap audit-teaser-inner"><div><p className="eyebrow">HCU Ω∞ · MAPA DE TRANSFORMACIÓN</p><h2>Explora sistemas interconectados, no temas aislados.</h2><p>Un universo interactivo de dominios y relaciones multidireccionales para formular preguntas, exponer riesgos y organizar qué evidencia falta antes de convertir una hipótesis en afirmación.</p></div><Link className="button button-primary" href="/hcu">Explorar el universo HCU <ArrowRight aria-hidden="true" /></Link></div></section>

      <section className="member-section" id="membresia"><div className="section-wrap member-layout"><div className="member-intro"><p className="eyebrow">05 — POR QUÉ FORMAR PARTE</p><h2>Tu trabajo merece <em>contexto, atribución y continuidad.</em></h2><p>La membresía está pensada para personas que quieran compartir conocimiento, desarrollar software, documentar su trayectoria o participar en proyectos con reglas visibles.</p><Link className="button button-primary" href="/registro">Solicitar membresía <ArrowRight aria-hidden="true" /></Link><p className="small-note">La inscripción no promete empleo, remuneración, becas, financiación, certificación académica ni aceptación automática en proyectos.</p></div><div className="benefit-grid">{benefits.map(([title, text], i) => <article key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>

      <section className="id-section"><div className="section-wrap id-layout"><div><p className="eyebrow">06 — IDENTIDAD TAMV</p><h2>Una clave para encontrar <em>tu contribución.</em></h2><p>El TAMV ID es un identificador interno de miembro diseñado para ser persistente y resoluble, con controles de privacidad y metadatos explícitos. Se inspira en buenas prácticas de identificadores persistentes; no reemplaza ni se presenta como equivalente a ORCID, ISNI o DOI.</p><div className="id-example"><Fingerprint aria-hidden="true" /><div><span>FORMATO DE REFERENCIA</span><strong>TAMV-2026-7A1C…-D</strong><small>Ejemplo ilustrativo; no corresponde a una persona registrada.</small></div></div><Link className="inline-link" href="/resolver">Resolver un TAMV ID <ArrowUpRight aria-hidden="true" /></Link></div><div className="id-principles"><article><strong>01</strong><span>Persistente</span><p>No cambia cuando cambia el nombre público.</p></article><article><strong>02</strong><span>Controlado</span><p>El perfil público requiere consentimiento expreso.</p></article><article><strong>03</strong><span>Interoperable</span><p>Puede enlazar ORCID y obras con DOI sin sustituirlos.</p></article><article><strong>04</strong><span>Honesto</span><p>Verificación de correo y verificación de identidad son cosas distintas.</p></article></div></div></section>

      <section className="roadmap-section section-wrap"><div><p className="eyebrow">07 — QUÉ PRETENDEMOS</p><h2>De una iniciativa documentada a una <em>red confiable.</em></h2><p>El objetivo es consolidar un directorio de personas y proyectos, conectar resultados públicos, habilitar procesos de colaboración claros y desarrollar una gobernanza proporcional a la participación real de la comunidad.</p></div><div className="roadmap-list"><article><span>AHORA</span><p>Identidad institucional, registro, perfil voluntario y documentación.</p></article><article><span>PRÓXIMO</span><p>Verificación voluntaria de identificadores externos, historial de contribuciones y flujos de revisión.</p></article><article><span>EVOLUCIÓN</span><p>Interoperabilidad ampliada, acuerdos de colaboración y servicios sostenibles sujetos a evaluación.</p></article></div></section>

      <section className="closing-cta"><div className="section-wrap closing-inner"><div><p className="eyebrow">TU SIGUIENTE PASO</p><h2>Forma parte de lo que merece <em>perdurar.</em></h2><p>Empieza con una identidad TAMV, decide qué compartir y construye un registro claro de tu trabajo.</p></div><div className="closing-actions"><Link className="button button-primary" href="/registro">Crear mi TAMV ID <ArrowRight aria-hidden="true" /></Link><Link className="button button-ghost" href="/membresia">Leer condiciones de membresía <ArrowUpRight aria-hidden="true" /></Link></div></div></section>

      <footer className="site-footer"><div className="section-wrap"><div className="footer-main"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><p>Investigación · Tecnología · Memoria viva<br />Iniciativa independiente con origen en Hidalgo, México.</p><div className="footer-links"><Link href="/membresia">Membresía</Link><Link href="/catalogo">Catálogo</Link><Link href="/investigacion">Investigación</Link><Link href="/recursos">Recursos</Link><Link href="/politica-editorial">Política editorial</Link><Link href="/privacidad">Privacidad</Link><Link href="/terminos">Términos</Link><Link href="/cuenta">Mi cuenta</Link></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} TAMV Online Network</span><span>No representa acreditación ni respaldo de terceros.</span><a href="mailto:anubiscastillo@visitarealdelmonte.online">Contacto institucional <ArrowUpRight aria-hidden="true" /></a></div></div></footer>
    </main>
  )
}
