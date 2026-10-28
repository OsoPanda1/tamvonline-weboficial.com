import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, BookOpen, Compass, Fingerprint, Globe2, ShieldCheck } from 'lucide-react'
import SiteHeader from '@/app/components/site-header'

const knowledgeAreas = [
  ['01', 'Arquitectura de conocimiento', 'Cómo convertir ideas, fuentes y decisiones en sistemas legibles, trazables y capaces de evolucionar.'],
  ['02', 'Tecnología con contexto', 'Software, inteligencia artificial y diseño de producto orientados a problemas reales, no a la novedad por sí misma.'],
  ['03', 'Memoria territorial', 'La experiencia local como fuente de innovación, identidad y continuidad para comunidades latinoamericanas.'],
  ['04', 'Gobernanza responsable', 'Criterios para declarar límites, autoría, evidencia, riesgos y responsabilidad antes de escalar una propuesta.'],
]

const principles = [
  ['Evidencia antes que autoridad', 'Una afirmación vale por la calidad de sus fuentes, método y límites, no por el volumen de su presentación.'],
  ['Interoperabilidad antes que encierro', 'El conocimiento debe poder conectarse con identificadores, repositorios y comunidades sin perder su procedencia.'],
  ['La persona conserva el control', 'La identidad pública, los datos biográficos y el nivel de exposición se comparten con consentimiento.'],
]

export default function FounderPage() {
  return <main className="founder-page site-shell">
    <div className="utility-strip"><span>PERFIL INSTITUCIONAL · TAMV ONLINE NETWORK</span><span>HIDALGO · MÉXICO</span><span>DOSSIER DE CONOCIMIENTO</span></div>
    <SiteHeader active="home" />
    <section className="founder-dossier-hero">
      <div className="section-wrap founder-dossier-grid">
        <div className="founder-dossier-portrait"><img src="/images/ceo-tamv.jpg" alt="Edwin Oswaldo Castillo Trejo, fundador e impulsor de TAMV Online Network" /><div className="portrait-meta"><span>EDWIN OSWALDO CASTILLO TREJO</span><span>ANUBIS VILLASEÑOR · FIRMA CREATIVA</span></div></div>
        <div className="founder-dossier-intro"><Link className="back-link" href="/"><ArrowLeft aria-hidden="true" /> Volver a TAMV</Link><p className="eyebrow">03 — FUNDADOR E IMPULSOR</p><h1>Una visión para que el conocimiento <em>tenga memoria.</em></h1><p className="body-large">Edwin Oswaldo Castillo Trejo impulsa TAMV Online Network como una iniciativa mexicana para conectar tecnología, identidad digital, memoria territorial y colaboración latinoamericana.</p><p className="body-copy">Este dossier reúne el catálogo de conocimiento asociado a su trabajo público: no es una biografía inflada ni una certificación de títulos. Es una lectura clara de las preguntas, principios y líneas de investigación que orientan TAMV.</p><div className="founder-dossier-actions"><Link className="button button-primary" href="#catalogo">Explorar conocimiento <ArrowUpRight aria-hidden="true" /></Link><a className="button button-ghost" href="https://orcid.org/0009-0008-5050-1539" target="_blank" rel="noopener noreferrer">ORCID público <ArrowUpRight aria-hidden="true" /></a></div></div>
      </div>
    </section>
    <section className="founder-signal"><div className="section-wrap signal-grid"><div><span className="section-number">PERFIL EN UNA LÍNEA</span><p>Diseñar puentes entre la memoria de un territorio y la infraestructura digital que puede preservarla.</p></div><div className="signal-facts"><span><Fingerprint aria-hidden="true" /> Identidad portable</span><span><Globe2 aria-hidden="true" /> Perspectiva latinoamericana</span><span><ShieldCheck aria-hidden="true" /> Límites explícitos</span></div></div></section>
    <section className="founder-knowledge section-wrap" id="catalogo"><div className="founder-section-heading"><div><p className="eyebrow">CATÁLOGO DE CONOCIMIENTO</p><h2>Cuatro campos para <em>pensar y construir.</em></h2></div><p>La presentación organiza el trabajo como un mapa editorial: cada campo puede abrir nuevos proyectos, documentos, prototipos y colaboraciones.</p></div><div className="knowledge-catalog">{knowledgeAreas.map(([n, title, text]) => <article key={n}><span>{n}</span><BookOpen aria-hidden="true" /><h3>{title}</h3><p>{text}</p><Link href="/investigacion">Ver línea de investigación <ArrowUpRight aria-hidden="true" /></Link></article>)}</div></section>
    <section className="founder-principles"><div className="section-wrap principles-layout"><div><p className="eyebrow">CRITERIO DE TRABAJO</p><h2>El método también <em>es parte del resultado.</em></h2><p className="body-copy">TAMV toma lo mejor de los foros de conocimiento: conversación abierta, documentación técnica, preguntas difíciles y comunidad. Lo integra con una capa adicional de contexto, procedencia y responsabilidad.</p></div><div className="principle-list">{principles.map(([title, text], i) => <article key={title}><strong>0{i + 1}</strong><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>
    <section className="founder-next section-wrap"><div><p className="eyebrow">SIGUIENTE CAPÍTULO</p><h2>Del perfil al trabajo <em>que puede consultarse.</em></h2><p>Conoce las investigaciones, propuestas y recursos que convierten esta visión en artefactos públicos.</p></div><div className="founder-next-links"><Link className="button button-primary" href="/investigacion">Abrir investigación <ArrowUpRight aria-hidden="true" /></Link><Link className="button button-ghost" href="/catalogo">Consultar catálogo <ArrowUpRight aria-hidden="true" /></Link></div></section>
  </main>
}
