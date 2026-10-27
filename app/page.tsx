import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ExternalLink,
  FileText,
  Globe2,
  Menu,
  Network,
  Search,
  ShieldCheck,
} from 'lucide-react'

const logos = {
  tamv: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TAMVONLINE-OFICIAL-Id1lguzYc8qoEFd5VTU26wdHKq3Rj2.jpg',
  isabella: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-isav6-Nl0ITHeMEyZ7OKDsu4Y5tDqz0xQ64G.jpeg',
  science: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Open%20Science%20Latinoam%C3%A9rica_%20Emblema%20del%20conocimiento%20%D0%BA%D0%B0%D0%BB%D0%B3%D0%B0%D0%BD-WWExzkPhwla1higZtJUGJxLJAq0DeU.png',
}

const records = [
  ['ORCID', '0009-0008-5050-1539', 'Identidad persistente'],
  ['ISNI', '0000000531699229', 'Identidad normalizada'],
  ['ZENODO', 'Repositorio de resultados', 'Datos · versiones · DOI'],
  ['OSF', 'TAMV Paradigm / RDM Hub', 'Proyectos reproducibles'],
]

const research = [
  ['01', 'Inteligencia artificial', 'Sistemas cognitivos, agentes inteligentes y gobernanza responsable.'],
  ['02', 'Infraestructura digital', 'Arquitecturas interoperables, resilientes y soberanas.'],
  ['03', 'Ciencia abierta', 'Datos, métodos y resultados documentados para consulta y reutilización.'],
  ['04', 'Patrimonio y territorio', 'Tecnología aplicada a memoria, cultura y desarrollo local.'],
]

export default function Page() {
  return (
    <main className="portal-shell">
      <div className="utility-bar"><span>RED MEXICANA DE INVESTIGACIÓN APLICADA</span><span>REAL DEL MONTE · HIDALGO · MÉXICO</span><span>ES / EN</span></div>
      <header className="portal-header">
        <a className="wordmark" href="#inicio" aria-label="TAMV Online Network"><span className="wordmark-symbol">T</span><span><b>TAMV</b><small>ONLINE NETWORK</small></span></a>
        <nav aria-label="Navegación principal"><a href="#institucion">Institución</a><a href="#investigacion">Investigación</a><a href="#repositorio">Repositorio</a><a href="#gobernanza">Gobernanza</a></nav>
        <div className="header-tools"><a href="#repositorio" className="search-link"><Search aria-hidden="true" /> Buscar</a><a href="#contacto" className="primary-link">Colaborar <ArrowUpRight aria-hidden="true" /></a><button className="mobile-menu" aria-label="Abrir menú"><Menu aria-hidden="true" /></button></div>
      </header>

      <section className="masthead" id="inicio"><div className="masthead-copy"><p className="overline">TAMV ONLINE NETWORK · ORGANIZACIÓN INDEPENDIENTE</p><h1>Investigación con<br /><i>evidencia pública.</i></h1><p className="masthead-lead">Una infraestructura institucional para producir, preservar y compartir conocimiento tecnológico desde México.</p><div className="masthead-actions"><a className="solid-button" href="#investigacion">Explorar investigación <ArrowUpRight aria-hidden="true" /></a><a className="quiet-button" href="#institucion">Conocer TAMV <ChevronDown aria-hidden="true" /></a></div></div><aside className="masthead-index"><span>01 / 04</span><strong>Conocimiento<br />abierto</strong><p>Identidad · método · trazabilidad</p></aside></section>

      <section className="institution-bar" id="institucion"><div><span className="section-label">01 — INSTITUCIÓN</span><h2>Un nodo de conocimiento<br /><i>con responsabilidad pública.</i></h2></div><div className="institution-note"><p>TAMV Online Network es una organización independiente dedicada a investigación aplicada, desarrollo tecnológico, preservación patrimonial y ciencia abierta.</p><a className="inline-link" href="#gobernanza">Leer sobre nuestro mandato <ArrowUpRight aria-hidden="true" /></a></div></section>

      <section className="proof-section" id="repositorio"><div className="section-top"><span className="section-label">02 — IDENTIDAD Y TRAZABILIDAD</span><span className="section-meta">REGISTROS PÚBLICOS / 2026</span></div><div className="proof-intro"><h2>La confianza se<br /><i>documenta.</i></h2><p>Seguimos prácticas de identificación persistente, preservación digital y apertura de resultados inspiradas en los principales ecosistemas científicos internacionales.</p></div><div className="records-grid">{records.map(([label, value, detail]) => <a className="record-card" href="#contacto" key={label}><div className="record-top"><span>{label}</span><ExternalLink aria-hidden="true" /></div><strong>{value}</strong><small>{detail}</small></a>)}</div></section>

      <section className="research-section" id="investigacion"><div className="section-top"><span className="section-label">03 — AGENDA DE INVESTIGACIÓN</span><a className="inline-link" href="#contacto">Ver catálogo completo <ArrowUpRight aria-hidden="true" /></a></div><div className="research-heading"><h2>Preguntas que<br /><i>merecen método.</i></h2><p>Cuatro líneas de trabajo para construir capacidades tecnológicas con impacto territorial, rigor metodológico y responsabilidad.</p></div><div className="research-list">{research.map(([number, title, text]) => <article key={number}><span className="research-number">{number}</span><h3>{title}</h3><p>{text}</p><ArrowUpRight aria-hidden="true" /></article>)}</div></section>

      <section className="repository-section"><div className="repository-panel"><div><span className="section-label">04 — REPOSITORIO DE RESULTADOS</span><h2>Publicaciones, datos<br /><i>y versiones.</i></h2><p>Un registro editorial para seguir el ciclo completo de cada iniciativa: pregunta, método, resultado y preservación.</p><a className="light-button" href="#contacto">Consultar producción <ArrowUpRight aria-hidden="true" /></a></div><div className="repository-stats"><div><strong>04</strong><span>Líneas activas</span></div><div><strong>03</strong><span>Proyectos destacados</span></div><div><strong>100%</strong><span>Enfoque documentado</span></div></div></div></section>

      <section className="governance-section" id="gobernanza"><div className="section-top"><span className="section-label">05 — PRINCIPIOS DE GOBERNANZA</span><span className="section-meta">MARCO INSTITUCIONAL</span></div><div className="governance-grid"><div><ShieldCheck aria-hidden="true" /><h3>Rigor antes que ruido</h3><p>Declaramos alcance, limitaciones, fuentes y criterios de validación.</p></div><div><Network aria-hidden="true" /><h3>Interoperabilidad</h3><p>Preferimos estándares, identificadores y formatos que otros puedan reutilizar.</p></div><div><Globe2 aria-hidden="true" /><h3>Impacto territorial</h3><p>La tecnología adquiere sentido cuando fortalece comunidades y patrimonio.</p></div><div><BookOpen aria-hidden="true" /><h3>Acceso abierto</h3><p>El conocimiento financiado y producido con vocación pública debe circular.</p></div></div></section>

      <section className="affiliations" id="contacto"><div className="affiliation-copy"><span className="section-label">06 — ECOSISTEMA</span><h2>Tres identidades.<br /><i>Una arquitectura común.</i></h2><p>Iniciativas complementarias para investigación, inteligencia artificial y ciencia abierta en Latinoamérica.</p><a className="solid-button" href="mailto:anubiscastillo@visitarealdelmonte.online">Iniciar colaboración <ArrowUpRight aria-hidden="true" /></a></div><div className="logo-rail"><div className="affiliation-card tamv-card"><img src={logos.tamv} alt="Logotipo oficial de TAMV Online Network" /></div><div className="affiliation-card"><img src={logos.isabella} alt="Logotipo de Isabella Villaseñor AI" /></div><div className="affiliation-card science-card"><img src={logos.science} alt="Logotipo de Open Science Latinoamérica" /></div></div></section>

      <footer><div className="footer-main"><div className="wordmark"><span className="wordmark-symbol">T</span><span><b>TAMV</b><small>ONLINE NETWORK</small></span></div><p>Investigación aplicada · infraestructura digital · ciencia abierta</p><div className="footer-contact"><span>CONTACTO INSTITUCIONAL</span><a href="mailto:anubiscastillo@visitarealdelmonte.online">anubiscastillo@visitarealdelmonte.online</a><span>Real del Monte, Hidalgo, México</span></div></div><div className="footer-bottom"><span>© 2026 TAMV Online Network</span><span>Identidad · método · trazabilidad</span><span>Política de apertura</span></div></footer>
    </main>
  )
}
