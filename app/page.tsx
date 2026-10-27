import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  CircleCheck,
  ExternalLink,
  Fingerprint,
  Globe2,
  Landmark,
  Mail,
  Menu,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const logos = {
  tamv: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/TAMVONLINE-OFICIAL-Id1lguzYc8qoEFd5VTU26wdHKq3Rj2.jpg',
  isabella: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-isav6-Nl0ITHeMEyZ7OKDsu4Y5tDqz0xQ64G.jpeg',
  science:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Open%20Science%20Latinoam%C3%A9rica_%20Emblema%20del%20conocimiento%20%D0%BA%D0%B0%D0%BB%D0%B3%D0%B0%D0%BD-WWExzkPhwla1higZtJUGJxLJAq0DeU.png',
}

const areas = [
  {
    number: '01',
    icon: Sparkles,
    title: 'Inteligencia artificial',
    description:
      'Arquitecturas cognitivas, sistemas multiagente y gobernanza responsable de agentes inteligentes.',
  },
  {
    number: '02',
    icon: Network,
    title: 'Sistemas distribuidos',
    description:
      'Infraestructuras digitales resilientes, interoperables y orientadas a la continuidad operativa.',
  },
  {
    number: '03',
    icon: BookOpen,
    title: 'Ciencia abierta',
    description:
      'Conocimiento verificable mediante repositorios, identificadores persistentes y documentación pública.',
  },
  {
    number: '04',
    icon: Landmark,
    title: 'Patrimonio digital',
    description:
      'Preservación y difusión del patrimonio histórico, cultural y territorial a través de tecnología.',
  },
]

const identifiers = [
  { label: 'ORCID', value: '0009-0008-5050-1539', href: 'https://orcid.org/0009-0008-5050-1539' },
  { label: 'ISNI', value: '0000000531699229', href: '#' },
  { label: 'Zenodo', value: 'Producción científica y técnica', href: '#' },
  { label: 'OSF', value: 'The TAMV Paradigm · RDM Digital Hub', href: '#' },
]

const projects = [
  {
    type: 'Programa de investigación',
    title: 'Isabella Genesis',
    description:
      'Inteligencia artificial, sistemas cognitivos distribuidos y gobernanza de agentes inteligentes.',
    tag: 'En investigación',
  },
  {
    type: 'Arquitectura digital',
    title: 'TAMV Sovereign Fabric',
    description:
      'Marco conceptual para arquitecturas interoperables, resilientes y orientadas a la autonomía tecnológica.',
    tag: 'Conceptual',
  },
  {
    type: 'Innovación territorial',
    title: 'RDM Digital Hub',
    description:
      'Transformación digital, patrimonio cultural, turismo inteligente y desarrollo territorial para Real del Monte.',
    tag: 'Activo',
  },
]

export default function Page() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="TAMV Online Network, inicio">
          <span className="brand-mark">T</span>
          <span>
            <strong>TAMV</strong>
            <small>ONLINE NETWORK</small>
          </span>
        </a>
        <nav className="main-nav" aria-label="Navegación principal">
          <a href="#organizacion">Organización</a>
          <a href="#investigacion">Investigación</a>
          <a href="#proyectos">Proyectos</a>
          <a href="#ciencia-abierta">Ciencia abierta</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="header-action" href="#identificadores">
          Ver identificadores <ArrowUpRight aria-hidden="true" />
        </a>
        <button className="mobile-menu" aria-label="Abrir menú"><Menu aria-hidden="true" /></button>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="eyebrow"><span /> ORGANIZACIÓN INDEPENDIENTE DE INVESTIGACIÓN</div>
          <h1>Conocimiento que<br /><em>permanece abierto.</em></h1>
          <p className="hero-lead">Investigación aplicada, infraestructura digital y ciencia abierta desde México.</p>
          <p className="hero-copy">TAMV Online Network es una organización independiente dedicada al desarrollo tecnológico, la preservación patrimonial y la generación de conocimiento verificable.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#organizacion">Conocer la organización <ChevronRight aria-hidden="true" /></a>
            <a className="button button-ghost" href="#investigacion">Explorar investigación <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </div>
        <div className="hero-aside" aria-label="Sede institucional">
          <div className="aside-line" />
          <span>SEDE OPERATIVA</span>
          <strong>Real del Monte,<br />Hidalgo, México</strong>
          <small>20°08′N · 98°40′W</small>
        </div>
        <div className="hero-scroll"><span /> Desplazar para explorar</div>
      </section>

      <section className="evidence-strip" id="identificadores">
        <div className="section-kicker">EVIDENCIA INSTITUCIONAL <span>—</span> 01</div>
        <div className="evidence-intro"><strong>Una identidad pública,<br /><em>trazable y persistente.</em></strong><p>La actividad de TAMV se organiza alrededor de identificadores permanentes y repositorios abiertos.</p></div>
        <div className="identifier-list">
          {identifiers.map((item) => <a className="identifier" href={item.href} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><ExternalLink aria-hidden="true" /></a>)}
        </div>
      </section>

      <section className="section about-section" id="organizacion">
        <div className="section-heading"><div className="section-kicker">QUIÉNES SOMOS <span>—</span> 02</div><span className="section-index">TAMV / 2026</span></div>
        <div className="about-grid"><h2>Una red para<br /><em>hacer visible</em> lo que importa.</h2><div className="about-text"><p className="large-copy">TAMV Online Network es una organización independiente de investigación aplicada, desarrollo tecnológico y ciencia abierta, originada en Real del Monte, Hidalgo, México.</p><p>Integramos investigación tecnológica, infraestructura digital, preservación patrimonial y gobernanza responsable de tecnologías emergentes. Nuestro trabajo se publica con la convicción de que el conocimiento debe poder ser consultado, rastreado y reutilizado.</p><a className="text-link" href="#ciencia-abierta">Nuestra declaración institucional <ArrowUpRight aria-hidden="true" /></a></div></div>
        <div className="principles"><div><Fingerprint aria-hidden="true" /><strong>Verificabilidad</strong><span>Cada afirmación tiene una fuente.</span></div><div><ShieldCheck aria-hidden="true" /><strong>Responsabilidad</strong><span>Tecnología orientada al beneficio público.</span></div><div><Globe2 aria-hidden="true" /><strong>Interoperabilidad</strong><span>Abierto por diseño, local por origen.</span></div></div>
      </section>

      <section className="section areas-section" id="investigacion">
        <div className="section-heading"><div className="section-kicker">LÍNEAS DE INVESTIGACIÓN <span>—</span> 03</div><a className="text-link" href="#proyectos">Ver todas las líneas <ArrowUpRight aria-hidden="true" /></a></div>
        <div className="areas-grid">{areas.map((area) => { const Icon = area.icon; return <article className="area-card" key={area.number}><span className="card-number">{area.number}</span><Icon aria-hidden="true" /><h3>{area.title}</h3><p>{area.description}</p><a href="#proyectos" aria-label={`Explorar ${area.title}`}><ArrowUpRight aria-hidden="true" /></a></article> })}</div>
      </section>

      <section className="projects-section" id="proyectos">
        <div className="section projects-inner"><div className="section-heading"><div className="section-kicker">PROYECTOS DESTACADOS <span>—</span> 04</div><span className="section-index light">CATÁLOGO PÚBLICO</span></div><div className="projects-intro"><h2>Investigación en<br /><em>movimiento.</em></h2><p>Una selección de programas y marcos de trabajo que documentan nuestra actividad actual.</p></div><div className="project-list">{projects.map((project, index) => <article className="project-row" key={project.title}><span className="project-index">0{index + 1}</span><div className="project-main"><small>{project.type}</small><h3>{project.title}</h3></div><p>{project.description}</p><span className="project-tag">{project.tag}</span><ArrowUpRight aria-hidden="true" /></article>)}</div></div>
      </section>

      <section className="section partners-section" id="ciencia-abierta">
        <div className="section-heading"><div className="section-kicker">ECOSISTEMA DE COLABORACIÓN <span>—</span> 05</div><span className="section-index">TRES NODOS / UNA VISIÓN</span></div>
        <div className="partner-grid"><div className="partner-copy"><h2>La ciencia crece<br /><em>cuando circula.</em></h2><p>Colaboramos para construir infraestructuras de conocimiento que conecten tecnología, territorio y comunidad.</p><a className="button button-primary" href="mailto:anubiscastillo@visitarealdelmonte.online">Iniciar una colaboración <ArrowUpRight aria-hidden="true" /></a></div><div className="partner-logos"><div className="logo-card logo-tamv"><img src={logos.tamv} alt="Logotipo oficial de TAMV Online Network" /></div><div className="logo-card"><img src={logos.isabella} alt="Logotipo de Isabella Villaseñor AI" /></div><div className="logo-card science-logo"><img src={logos.science} alt="Logotipo de Open Science Latinoamérica" /></div></div></div>
      </section>

      <footer className="site-footer" id="contacto"><div className="footer-top"><div className="footer-brand"><div className="brand"><span className="brand-mark">T</span><span><strong>TAMV</strong><small>ONLINE NETWORK</small></span></div><p>Tecnología avanzada mexicana versátil.<br />Investigación, evidencia y conocimiento abierto.</p></div><div className="footer-links"><div><span>EXPLORAR</span><a href="#organizacion">Organización</a><a href="#investigacion">Investigación</a><a href="#proyectos">Proyectos</a></div><div><span>RECURSOS</span><a href="#identificadores">Identificadores</a><a href="#ciencia-abierta">Ciencia abierta</a><a href="#contacto">Contacto</a></div><div><span>CONTACTO</span><a href="mailto:anubiscastillo@visitarealdelmonte.online"><Mail aria-hidden="true" /> anubiscastillo@<br />visitarealdelmonte.online</a><p>Real del Monte, Hidalgo<br />México</p></div></div></div><div className="footer-bottom"><span>© 2026 TAMV Online Network</span><span>Conocimiento abierto · Impacto colectivo</span><span>ES / EN</span></div></footer>
    </main>
  )
}
