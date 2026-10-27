import SiteHeader from '@/app/components/site-header';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export const metadata = { title: 'Centro de recursos abiertos', description: 'Recursos de documentación, desarrollo, modelos de IA, ciencia abierta e identificación persistente.' };
const resources = [
  {type:'Inteligencia estratégica · Mapa de transformación',name:'TAMV Ω∞ HCU',text:'Mapa interactivo conceptual con seis dominios, entidades, hyperedges, riesgos, incertidumbre y escenarios etiquetados según su estado de evidencia.',url:'/hcu',category:'TAMV'},
  {type:'Desarrollo · Documentación',name:'OpenAI Developers',text:'Documentación oficial, guías y ejemplos para construir aplicaciones.',url:'https://developers.openai.com/',category:'Desarrollo'},
  {type:'Desarrollo · Comunidad',name:'OpenAI Developer Community',text:'Foro público de preguntas y experiencias de implementación.',url:'https://community.openai.com/',category:'Comunidad'},
  {type:'Desarrollo · Aprendizaje',name:'Microsoft Learn',text:'Documentación y rutas para herramientas y tecnologías de desarrollo.',url:'https://learn.microsoft.com/',category:'Desarrollo'},
  {type:'IA · Modelos y conjuntos de datos',name:'Hugging Face Hub',text:'Modelos, datasets y demostraciones. Revisa cada tarjeta y licencia del recurso.',url:'https://huggingface.co/docs/hub/main/index',category:'IA y datos'},
  {type:'Desarrollo · Recursos empresariales',name:'IBM Developer',text:'Tutoriales, rutas, artículos y recursos de construcción tecnológica.',url:'https://developer.ibm.com/',category:'Desarrollo'},
  {type:'Ciencia abierta · Principios',name:'UNESCO Open Science',text:'Recomendación y principios para acceso, colaboración y conocimiento científico abierto.',url:'https://www.unesco.org/en/open-science',category:'Ciencia abierta'},
  {type:'Ciencia abierta · Interoperabilidad',name:'OpenAIRE',text:'Descubrimiento e interconexión de resultados, proyectos y datos de investigación.',url:'https://www.openaire.eu/',category:'Ciencia abierta'},
  {type:'Repositorio · DOI',name:'Zenodo',text:'Depósito de documentos, datos y software con metadatos e identificadores persistentes.',url:'https://zenodo.org/',category:'Ciencia abierta'},
  {type:'Investigación · Resultados',name:'Figshare',text:'Publicación y descubrimiento de datos y otros productos de investigación.',url:'https://figshare.com/',category:'Ciencia abierta'},
  {type:'Identificadores · Organizaciones',name:'Research Organization Registry (ROR)',text:'Registro abierto de identificadores de organizaciones de investigación; consulta los criterios oficiales.',url:'https://ror.org/search',category:'Identidad'},
  {type:'Identificadores · Personas',name:'ORCID',text:'Identificador persistente para personas investigadoras y su producción declarada.',url:'https://orcid.org/',category:'Identidad'},
  {type:'Identificadores · Obras y autores',name:'ISNI',text:'Identificador normalizado para identidades públicas vinculadas con obras y creaciones.',url:'https://isni.org/',category:'Identidad'},
  {type:'Gobernanza · Revisión',name:'VETRA Ω∞',text:'Protocolo piloto TAMV para integridad, método, reproducibilidad, seguridad, derechos e impacto, con revisión humana y apelación.',url:'/vetra',category:'TAMV'},
  {type:'Institución · Plan estratégico',name:'Roadmap TAMV 2026–2028',text:'Fases propuestas de gobernanza, formalización legal, ROR, despliegue de Isabella y sostenibilidad de membresías.',url:'/roadmap',category:'TAMV'},
];
export default function ResourcesPage(){
 return <main><div className="utility-strip"><span>APRENDER · CONSTRUIR · DOCUMENTAR</span><span>RECURSOS EXTERNOS CURADOS</span></div>
 <SiteHeader active="/recursos" />
 <section className="legal-page"><div className="legal-container"><p className="legal-kicker">RECURSOS ABIERTOS · RUTAS DE APRENDIZAJE</p><h1>Un mapa para aprender, construir y compartir conocimiento.</h1><p>Directorio curado de documentación técnica, comunidades, modelos y ciencia abierta. La inclusión de una plataforma no implica alianza, patrocinio, afiliación o respaldo mutuo.</p><div className="legal-notice">Confirma la licencia, los términos y las condiciones de uso de cada material en la fuente original. No todos los modelos abiertos permiten cualquier uso comercial ni toda publicación es revisada por pares.</div></div></section>
 <section className="section-wrap resources-grid">{resources.map(r=><article key={r.name} className="resource-tile"><span>{r.type}</span><h2>{r.name}</h2><p>{r.text}</p><a href={r.url} target="_blank" rel="noopener noreferrer">Abrir recurso original <ArrowUpRight aria-hidden="true"/></a></article>)}</section>
 <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>TAMV Online Network · Recursos externos independientes</span><Link href="/politica-editorial">Política editorial</Link><Link href="/privacidad">Privacidad</Link></div></div></footer></main>
}
