import SiteHeader from '@/app/components/site-header';
import ResearchHcu from './research-hcu';
import Link from 'next/link';
import { ArrowUpRight, BookOpen, ExternalLink, FileCheck2, Globe2 } from 'lucide-react';

export const metadata = {
  title: 'Publicaciones, perfiles y trazabilidad',
  description: 'Índice de registros persistentes, divulgación profesional, perfiles e investigación pública asociados con Edwin Oswaldo Castillo Trejo y TAMV Online Network.',
};

const items = [
  {
    type: 'Repositorio · DOI reportado',
    title: 'Evaluación de consistencia conceptual Isabella AI',
    date: 'Registro citado en fuentes del proyecto · 2026',
    source: 'Zenodo',
    url: 'https://doi.org/10.5281/zenodo.20606361',
    evidence: 'El DOI se cita en el repositorio público de Isabella AI y en materiales de TAMV. En esta revisión no fue posible recuperar la ficha primaria de Zenodo para cotejar de manera independiente título, autoría, fecha, licencia y tipo de documento.',
    status: 'Ficha primaria pendiente de cotejo',
  },
  {
    type: 'Repositorio · DOI reportado',
    title: 'Blueprint CITEMESH / BookPI y redes P2P',
    date: 'Registro citado en materiales de TAMV · 2026',
    source: 'Zenodo',
    url: 'https://doi.org/10.5281/zenodo.19436662',
    evidence: 'El portal público de TAMV atribuye este DOI a un documento sobre infraestructura CITEMESH y BookPI. Antes de una cita académica formal deben confirmarse los metadatos y el contenido directamente en el registro de destino.',
    status: 'Ficha primaria pendiente de cotejo',
  },
  {
    type: 'Repositorio · DOI reportado',
    title: 'Soberanía digital territorial: marco operativo',
    date: 'Fecha de publicación por confirmar',
    source: 'Figshare',
    url: 'https://doi.org/10.6084/m9.figshare.32098846',
    evidence: 'El DOI aparece citado en una publicación institucional autogestionada. No se pudo cotejar directamente el registro original de Figshare en esta revisión; por eso no se le asigna aquí un título bibliográfico validado de forma independiente.',
    status: 'Citado por fuente del proyecto; metadatos por comprobar',
  },
  {
    type: 'Proyecto · OSF',
    title: 'TAMV / Isabella — registro de proyecto referenciado',
    date: 'Referencia indicada en repositorio público',
    source: 'Open Science Framework',
    url: 'https://osf.io/T3WMY',
    evidence: 'El repositorio público de Isabella AI referencia este identificador OSF. El enlace se proporciona como pista de trazabilidad, no como prueba de revisión por pares, aceptación editorial o afiliación institucional.',
    status: 'Referencia localizada en repositorio del proyecto',
  },
  {
    type: 'Divulgación profesional · AVIXA Xchange',
    title: 'TAMV e Isabella Villaseñor AI: propuesta de metaverso desde México',
    date: '5 diciembre 2025',
    source: 'AVIXA Xchange',
    url: 'https://xchange.avixa.org/posts/tamv-e-isabella-villasenor-ai-el-parteaguas-que-redefine-el-metaverso-desde-mexico',
    evidence: 'Publicación profesional firmada por Edwin Oswaldo Castillo Trejo en una plataforma sectorial. Acredita la existencia de una pieza pública de divulgación; no se presenta como artículo científico arbitrado.',
    status: 'Publicación externa de divulgación localizada',
  },
  {
    type: 'Divulgación profesional · AVIXA Xchange',
    title: 'Isabella Villaseñor AI: inteligencia ética nacida en Real del Monte',
    date: '5 diciembre 2025',
    source: 'AVIXA Xchange',
    url: 'https://xchange.avixa.org/posts/isabella-villasenor-ai',
    evidence: 'Artículo público atribuido a Edwin Oswaldo Castillo Trejo acerca del enfoque y la propuesta del sistema Isabella. Debe citarse como divulgación sectorial, no como validación independiente de capacidades técnicas.',
    status: 'Publicación externa de divulgación localizada',
  },
  {
    type: 'Divulgación profesional · AVIXA Xchange',
    title: 'TAMV 2026: modelo de plataforma para experiencias AV inmersivas',
    date: '15 febrero 2026',
    source: 'AVIXA Xchange',
    url: 'https://xchange.avixa.org/posts/tamv-2026-modelo-de-plataforma-civilizatoria-para-experiencias-av-inmersivas',
    evidence: 'Artículo publicado en AVIXA Xchange y firmado por Edwin Oswaldo Castillo Trejo. Documenta comunicación pública de la propuesta de arquitectura; no demuestra por sí mismo despliegue, evaluación independiente o adopción.',
    status: 'Publicación externa de divulgación localizada',
  },
  {
    type: 'Divulgación profesional · AVIXA Xchange',
    title: 'TAMV Online: plataforma mexicana civilizacional digital',
    date: '5 diciembre 2025',
    source: 'AVIXA Xchange',
    url: 'https://xchange.avixa.org/posts/tamv-online-primer-plataforma-mexicana-civilizacional-digital',
    evidence: 'Publicación de presentación conceptual del proyecto. Algunos datos de mercado, adopción y proyecciones que contiene son afirmaciones de la pieza y no se tratan aquí como cifras auditadas.',
    status: 'Publicación externa de divulgación localizada',
  },
  {
    type: 'Producción pública · perfil profesional',
    title: 'Artículos y reportes publicados en LinkedIn',
    date: 'Registros visibles de 2026',
    source: 'LinkedIn',
    url: 'https://www.linkedin.com/in/edwin-oswaldo-castillo-aka-anubis-villase%C3%B1or-69a847376/',
    evidence: 'El perfil público muestra títulos como “Informe de vanguardia tecnológica…”, “Atlas Transcendence” y “TAMV ONLINE™ 23,000 Horas de Silencio”. Son textos publicados en el perfil; cada uno debe tratarse como publicación profesional/autopublicada salvo prueba de un proceso editorial distinto.',
    status: 'Índice de perfil localizado; enlaces individuales por capturar',
  },
  {
    type: 'Portafolio profesional · fuente del titular',
    title: 'Portafolio profesional de Edwin Oswaldo Castillo Trejo',
    date: 'Portafolio web autogestionado',
    source: 'Portafolio de Edwin',
    url: 'https://portafolio-edwin.lovable.app/',
    evidence: 'Sitio profesional compartido por el titular para presentar su trayectoria y proyectos. Se integra como fuente primaria autodeclarada; las fechas, funciones, afiliaciones, resultados y credenciales que aparezcan allí deben contrastarse individualmente con repositorios, identificadores persistentes u otras fuentes independientes.',
    status: 'Enlace incorporado; contenido no cotejado en esta revisión',
  },
  {
    type: 'Identidad de investigador',
    title: 'ORCID — Edwin Oswaldo Castillo Trejo',
    date: 'Identificador persistente',
    source: 'ORCID',
    url: 'https://orcid.org/0009-0008-5050-1539',
    evidence: 'Identificador persistente asociado al perfil del investigador. Las obras y afiliaciones se deben comprobar registro por registro, distinguiendo elementos autoañadidos de elementos validados por organizaciones confiables.',
    status: 'Perfil público localizado',
  },
  {
    type: 'Identidad de obras y creadores',
    title: 'ISNI — identificador declarado por el titular',
    date: 'Identificador normalizado',
    source: 'ISNI',
    url: 'https://isni.org/isni/0000000531699229',
    evidence: 'Se publica como enlace declarado por el titular. Debe confirmarse que la ficha de destino corresponda a la misma persona y que la forma autorizada del nombre coincida.',
    status: 'Enlace público; correspondencia por confirmar',
  },
  {
    type: 'Perfil de investigación',
    title: 'ResearchGate — perfil público',
    date: 'Perfil profesional',
    source: 'ResearchGate',
    url: 'https://www.researchgate.net/profile/Edwin-Oswaldo-Castillo-Trejo',
    evidence: 'Punto de acceso al perfil señalado por el titular. No se recuperó en esta consulta un inventario de publicaciones que pueda cotejarse individualmente; se enlaza el perfil sin atribuir publicaciones no inspeccionadas.',
    status: 'Perfil localizado; publicaciones individuales por cotejar',
  },
];

export default function ResearchPage() {
  return <main>
    <div className="utility-strip"><span>PRODUCCIÓN PÚBLICA · TRAYECTORIA DOCUMENTAL</span><span>METADATOS · FUENTES · ALCANCE DE EVIDENCIA</span></div>
    <SiteHeader active="/investigacion" />
    <section className="legal-page"><div className="legal-container"><p className="legal-kicker">TRAYECTORIA · INVESTIGACIÓN · DIVULGACIÓN</p><h1>Una trayectoria se fortalece cuando sus fuentes pueden verificarse.</h1><p>Esta página organiza registros públicos, el portafolio profesional compartido por el titular y piezas de divulgación vinculadas con Edwin Oswaldo Castillo Trejo (Anubis Villaseñor) y TAMV Online Network. Separa identificadores y repositorios de artículos de divulgación, materiales autopublicados y evaluaciones académicas.</p><div className="legal-notice"><strong>Nota metodológica.</strong> Un DOI identifica una ficha o recurso, pero no equivale por sí solo a revisión por pares, acreditación, despliegue de software ni aval de la plataforma que lo aloja. Las descripciones de algunos depósitos se citan en páginas del propio proyecto y requieren cotejo con sus registros originales antes de una cita formal.</div><div className="research-summary-grid"><article><BookOpen aria-hidden="true"/><strong>Registros persistentes</strong><p>Zenodo, Figshare y OSF; comprobar metadatos del registro original.</p></article><article><Globe2 aria-hidden="true"/><strong>Divulgación sectorial</strong><p>Artículos en AVIXA Xchange y perfiles profesionales.</p></article><article><FileCheck2 aria-hidden="true"/><strong>Validación diferenciada</strong><p>No se confunde publicación, depósito, prueba y evaluación externa.</p></article></div></div></section>
    <ResearchHcu />
    <section className="section-wrap research-records">
      <div className="research-records-heading"><div><p className="eyebrow">ÍNDICE DE FUENTES PÚBLICAS</p><h2>Registros y publicaciones</h2></div><p>Enlaces revisados el 27 de octubre de 2026. El estado se refiere al alcance de esta revisión de fuentes, no a la calidad científica del trabajo.</p></div>
      <div className="research-record-list">{items.map((item,index)=><article key={item.url}><div className="research-record-no">{String(index+1).padStart(2,'0')}</div><div className="research-record-body"><div className="research-item-type">{item.type}</div><h3>{item.title}</h3><div className="research-item-meta"><span>{item.source}</span><span>{item.date}</span></div><p>{item.evidence}</p><div className="research-status"><span>{item.status}</span><a href={item.url} target="_blank" rel="noopener noreferrer">Consultar fuente <ArrowUpRight aria-hidden="true"/></a></div></div></article>)}</div>
    </section>
    <section className="section-wrap research-caveat"><h2>Alcance de la verificación</h2><ul><li>Los resultados localizados en AVIXA Xchange constituyen divulgación profesional pública; la página de la plataforma no se trata como arbitraje científico.</li><li>Los DOI de Zenodo y Figshare deben conservar sus metadatos originales. Esta revisión no atribuye licencias, instituciones financiadoras ni estado de revisión cuando no pudo comprobarse el registro primario.</li><li>El proyecto OSF se enlaza porque aparece citado en un repositorio público del ecosistema. No se afirma que OSF avale TAMV.</li><li>El nombre CERN asociado a Zenodo describe el contexto de la infraestructura del repositorio; no implica respaldo institucional de CERN a los trabajos depositados.</li><li>En la consulta realizada no localicé una publicación atribuible con evidencia suficiente en Lounge.AI. No se incluye esa plataforma como aval ni se afirma que no exista contenido fuera del alcance de búsqueda.</li><li>La presencia en ORCID, ISNI, ResearchGate o LinkedIn facilita la identificación y consulta, pero no sustituye la validación individual de obras, afiliaciones y contribuciones.</li></ul><div className="form-actions"><Link className="button button-primary" href="/catalogo">Abrir catálogo de fuentes</Link><a className="button button-ghost" href="https://github.com/OsoPanda1/ISABELLA-VERSION-TERMINUS-V6" target="_blank" rel="noopener noreferrer">Código de Isabella AI ↗</a><a className="button button-ghost" href="https://github.com/OsoPanda1/tamvonline-weboficial.com" target="_blank" rel="noopener noreferrer">Código institucional ↗</a></div></section>
    <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>© {new Date().getFullYear()} TAMV Online Network</span><span>Fuentes y alcance sujetos a revisión documental.</span><Link href="/politica-editorial">Política editorial</Link><Link href="/privacidad">Privacidad</Link></div></div></footer>
  </main>;
}
