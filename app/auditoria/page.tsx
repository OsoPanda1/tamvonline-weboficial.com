'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, BadgeCheck, BookOpenCheck, CheckCircle2,
  CircleAlert, Database, FileSearch, Fingerprint, FlaskConical, Gavel, Globe2,
  KeyRound, Network, Search, ShieldCheck, Sparkles, Waypoints,
} from 'lucide-react';

type ProviderState = { id: string; name: string; status: string; count: number; note?: string };
type ResearchItem = {
  id: string; provider: string; title: string; url: string; doi: string | null; year: number | null;
  authors: string[]; venue: string | null; resourceType: string | null; citedByCount: number | null;
  license: string | null; openAccess: boolean | null; evidenceClass: string; retrievedAt: string;
};
type ResearchResponse = { ok: boolean; query: string; results: ResearchItem[]; providers: ProviderState[]; methodology: string; sourceLinks?: Record<string,string>; error?: string };
type MetadataRecord = {
  provider: string; status: string; url: string; title: string | null; authors: string[]; year: number | null;
  publisher: string | null; resourceType: string | null; license: string | null; doi: string; note?: string;
};
type AuditResponse = {
  ok: boolean; doi: string; retrievedAt: string; auditHash: string; records: MetadataRecord[];
  readiness: { score: number; label: string; components: Record<string,{score:number;weight:number}>; nextActions: string[]; boundaries: string[] };
  persistence: { saved: boolean; message: string }; error?: string; limitation?: string;
};
type PatentProvider = { provider: string; status: string; count?: number; note: string; url: string; results?: Array<{publicationNumber:string;title:string}> };
type PatentResponse = { ok: boolean; query: string; checkedAt: string; providers: PatentProvider[]; limitations: string[]; error?: string };

const featureCards = [
  { icon: Network, title: 'Búsqueda federada', description: 'Cruza metadatos de OpenAlex, Crossref y DataCite; añade ROR para búsquedas de organizaciones.' },
  { icon: BadgeCheck, title: 'Validación de identificadores', description: 'Contrasta DOI en varios registros, muestra diferencias y evita convertir presencia en prueba de calidad.' },
  { icon: FlaskConical, title: 'Expediente reproducible', description: 'Explicita procedencia, campos ausentes, licencia, estado de revisión y acciones necesarias para reproducir.' },
  { icon: Gavel, title: 'Mapa de propiedad intelectual', description: 'Búsqueda preliminar EPO OPS con credenciales; enlaces oficiales a USPTO, WIPO y Espacenet.' },
  { icon: ShieldCheck, title: 'Cadena de evidencia', description: 'Calcula un SHA-256 de la instantánea y permite guardarla en Supabase asociada al TAMV ID.' },
  { icon: Sparkles, title: 'Capa de triaje Isabella', description: 'Convierte vacíos de documentación en próximos pasos de transferencia. No inventa precio ni valoración financiera.' },
];

const apiMap = [
  { name: 'OpenAlex', kind: 'Pública', state: 'Conector activo', note: 'Obras, autores, fuentes, instituciones, citas y conceptos.', url: 'https://help.openalex.org/api/' },
  { name: 'Crossref', kind: 'Pública', state: 'Conector activo', note: 'Metadatos DOI depositados por editoriales y otros miembros.', url: 'https://www.crossref.org/documentation/retrieve-metadata/rest-api/' },
  { name: 'DataCite', kind: 'Pública', state: 'Conector activo', note: 'DOI de datasets, software, informes y otros resultados; API pública Findable.', url: 'https://support.datacite.org/docs/rest-api' },
  { name: 'OpenAIRE Graph', kind: 'Pública', state: 'Conector activo', note: 'Conecta con el endpoint research-products; la API general también ofrece proyectos y organizaciones, que aún no se consultan desde este adaptador. Máximo 8 productos por consulta.', url: 'https://graph.openaire.eu/docs/apis/graph-api-v4/quickstart/' },
  { name: 'ROR', kind: 'Pública', state: 'Conector activo', note: 'Identificadores de organizaciones y búsqueda de nombres normalizados.', url: 'https://ror.readme.io/docs/rest-api' },
  { name: 'ORCID', kind: 'Credenciales', state: 'Enlace/API preparada por etapas', note: 'La API pública requiere registrar un cliente y cumplir sus términos; no se simula validación si no hay credenciales.', url: 'https://info.orcid.org/what-is-orcid/services/public-api/' },
  { name: 'OSF', kind: 'OAuth / token', state: 'Documentado, sin conector de edición', note: 'API v2 para proyectos, registros y materiales; acciones privadas requieren autorización.', url: 'https://developer.osf.io/' },
  { name: 'Dimensions', kind: 'Licencia / token', state: 'Documentación; no conectado', note: 'La API Analytics depende de suscripción institucional y restricciones de uso; no se usa como backend de la web sin licencia/entitlement.', url: 'https://docs.dimensions.ai/dsl/api.html' },
  { name: 'PubMed / NCBI', kind: 'API pública E-utilities', state: 'Conector de metadatos activo', note: 'Busca títulos/autores/año de PubMed mediante ESearch + ESummary; no descarga texto completo ni sustituye evaluación clínica o lectura crítica.', url: 'https://www.ncbi.nlm.nih.gov/home/develop/api/' },
  { name: 'arXiv / IEEE Xplore / ACM DL', kind: 'API/portal según proveedor', state: 'Enlaces de descubrimiento', note: 'Las interfaces y condiciones difieren por proveedor; no se afirma una consulta activa desde este motor.', url: 'https://arxiv.org/' },
  { name: 'ISNI / ORCID', kind: 'Identificadores persistentes', state: 'Enlaces y metadatos por etapas', note: 'Se enlazan identificadores externos; no se declara verificación de titularidad sin comprobarla en los sistemas fuente.', url: 'https://isni.org/' },
  { name: 'Zenodo / Figshare / OSF', kind: 'Repositorios abiertos', state: 'Portal y registros; escritura no habilitada', note: 'Los registros son fuentes de objetos y metadatos; publicar, actualizar o depositar requiere credenciales y permisos de cada servicio.', url: 'https://zenodo.org/' },
  { name: 'Eclipse Foundation / NIST / WEF', kind: 'Estándares y gobernanza', state: 'Referencia metodológica', note: 'Se consultan marcos, estándares y principios publicados; esta app no se presenta como certificada ni respaldada por esas entidades.', url: 'https://www.nist.gov/itl/ai-risk-management-framework' },
  { name: 'LearnWorlds / Sourcegraph', kind: 'APIs de producto', state: 'No conectados', note: 'LearnWorlds expone API de cursos/usuarios con claves del tenant; Sourcegraph cuenta con APIs para búsqueda de código, sujetas a versión y despliegue. Requieren integración separada.', url: 'https://sourcegraph.com/docs/api' },
  { name: 'Lounge.ai', kind: 'Comunidad / inteligencia de mercado', state: 'Datos públicos por enlace; sin conector API', note: 'Publica datasets y benchmarks sobre mercado de IA, inversiones y herramientas. Son datos del proveedor con alcance propio; esta versión no los importa automáticamente ni trata rankings comerciales como evidencia académica.', url: 'https://lounge.ai/press' },
  { name: 'EPO Open Patent Services', kind: 'OAuth client credentials', state: 'Conector activo si hay claves', note: 'Busca bibliografía de patentes; no sustituye análisis jurídico de reivindicaciones.', url: 'https://developers.epo.org/' },
  { name: 'USPTO Open Data Portal', kind: 'API key', state: 'Conexión pendiente de endpoint específico', note: 'La API requiere clave. No se declara una búsqueda de patentes automática sin configurar y probar el endpoint autorizado.', url: 'https://data.uspto.gov/apis/getting-started' },
  { name: 'WIPO PATENTSCOPE', kind: 'Manual / términos oficiales', state: 'Enlace manual, sin scraping', note: 'WIPO prohíbe consultas automatizadas y scraping en PATENTSCOPE; la plataforma abre el buscador oficial.', url: 'https://www.wipo.int/en/web/patentscope/data/terms_patentscope' },
  { name: 'Scopus / Web of Science', kind: 'Licencia / credenciales', state: 'No activado', note: 'Requieren registro de aplicación y entitlements o suscripción aplicables. La web ofrece links, no acceso simulado.', url: 'https://developer.clarivate.com/' },
  { name: 'Google Scholar / arXiv', kind: 'Enlace de descubrimiento', state: 'Enlaces manuales', note: 'No se hace scraping de Google Scholar; el panel genera búsquedas en los portales oficiales.', url: 'https://scholar.google.com/' },
  { name: 'Zenodo / OSF / OpenAIRE', kind: 'API / portal', state: 'Siguiente integración', note: 'Se documentan endpoints y credenciales antes de habilitar escritura, archivado o recolección.', url: 'https://zenodo.org/' },
];

export default function ResearchAuditPage() {
  const [tab, setTab] = useState<'search'|'doi'|'ip'|'apis'>('search');
  const [query, setQuery] = useState('');
  const [researchType, setResearchType] = useState<'research'|'organizations'>('research');
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResult, setSearchResult] = useState<ResearchResponse|null>(null);
  const [doi, setDoi] = useState('');
  const [persist, setPersist] = useState(false);
  const [auditBusy, setAuditBusy] = useState(false);
  const [auditError, setAuditError] = useState('');
  const [audit, setAudit] = useState<AuditResponse|null>(null);
  const [patentQuery, setPatentQuery] = useState('');
  const [patentBusy, setPatentBusy] = useState(false);
  const [patentError, setPatentError] = useState('');
  const [patents, setPatents] = useState<PatentResponse|null>(null);

  async function searchResearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSearchError(''); setSearchResult(null);
    if (query.trim().length < 3) { setSearchError('Escribe al menos tres caracteres.'); return; }
    setSearchBusy(true);
    try {
      const response = await fetch('/api/research/search', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({query,type:researchType}), cache:'no-store' });
      const payload = await response.json() as ResearchResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'No fue posible consultar las fuentes.');
      setSearchResult(payload);
    } catch (error) { setSearchError(error instanceof Error ? error.message : 'Error de búsqueda.'); }
    finally { setSearchBusy(false); }
  }

  async function auditDoi(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAuditError(''); setAudit(null);
    if (!doi.trim()) { setAuditError('Introduce un DOI.'); return; }
    setAuditBusy(true);
    try {
      const response = await fetch('/api/research/audit', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({doi,persist}), cache:'no-store' });
      const payload = await response.json() as AuditResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'No fue posible cotejar los metadatos.');
      setAudit(payload);
    } catch (error) { setAuditError(error instanceof Error ? error.message : 'Error en la auditoría DOI.'); }
    finally { setAuditBusy(false); }
  }

  async function auditPatents(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPatentError(''); setPatents(null);
    if (patentQuery.trim().length < 3) { setPatentError('Introduce al menos tres caracteres.'); return; }
    setPatentBusy(true);
    try {
      const response = await fetch('/api/research/patents', { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({query:patentQuery}), cache:'no-store' });
      const payload = await response.json() as PatentResponse;
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'No fue posible consultar el motor de patentes.');
      setPatents(payload);
    } catch (error) { setPatentError(error instanceof Error ? error.message : 'Error en la búsqueda de IP.'); }
    finally { setPatentBusy(false); }
  }

  return <main>
    <div className="utility-strip"><span>INVESTIGACIÓN · INTEROPERABILIDAD · PROCEDENCIA</span><span>ISABELLA / EVIDENCE ENGINE · 1.0</span></div>
    <header className="site-header"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><nav className="site-nav" aria-label="Navegación"><Link href="/">Institución</Link><Link href="/investigacion">Investigación</Link><Link href="/hcu">HCU Ω∞</Link><Link href="/vetra">VETRA Ω</Link><Link href="/catalogo">Catálogo</Link><Link href="/membresia">Membresía</Link></nav><div className="header-actions"><Link className="button button-small button-primary" href="/registro">TAMV ID <ArrowUpRight aria-hidden="true"/></Link></div></header>
    <section className="legal-page"><div className="legal-container audit-hero"><p className="legal-kicker">CAPA DE INVESTIGACIÓN E IP · PREPARACIÓN INSTITUCIONAL</p><h1>Evidencia conectada. Decisiones que dejan rastro.</h1><p>Un espacio de consulta de metadatos académicos, verificación cruzada de DOI, búsquedas preliminares de propiedad intelectual y registro de instantáneas trazables. Integra prácticas de descubrimiento, identificadores persistentes y ciencia abierta sin afirmar que un índice o una marca avale TAMV.</p><div className="legal-notice"><strong>Límite esencial:</strong> los metadatos no certifican la calidad del trabajo; las citas no equivalen a calidad entre disciplinas; una búsqueda de patentes no es una opinión de patentabilidad ni libertad de operación. El motor Isabella organiza evidencia disponible y tareas pendientes; no emite certificación ni valoración financiera.</div></div></section>

    <section className="section-wrap audit-feature-grid">{featureCards.map(({icon:Icon,title,description})=><article key={title}><Icon aria-hidden="true"/><h2>{title}</h2><p>{description}</p></article>)}</section>

    <section className="section-wrap audit-workspace">
      <div className="audit-tabs" role="tablist" aria-label="Herramientas de auditoría">
        <button type="button" role="tab" aria-selected={tab==='search'} className={tab==='search'?'active':''} onClick={()=>setTab('search')}><Search aria-hidden="true"/> Búsqueda federada</button>
        <button type="button" role="tab" aria-selected={tab==='doi'} className={tab==='doi'?'active':''} onClick={()=>setTab('doi')}><BadgeCheck aria-hidden="true"/> Auditoría DOI</button>
        <button type="button" role="tab" aria-selected={tab==='ip'} className={tab==='ip'?'active':''} onClick={()=>setTab('ip')}><Gavel aria-hidden="true"/> Patentes e IP</button>
        <button type="button" role="tab" aria-selected={tab==='apis'} className={tab==='apis'?'active':''} onClick={()=>setTab('apis')}><Waypoints aria-hidden="true"/> Mapa de APIs</button>
      </div>

      {tab==='search' && <section className="audit-panel" aria-label="Búsqueda de publicaciones y organizaciones">
        <div className="audit-panel-heading"><span>01 / DESCUBRIMIENTO</span><h2>Busca una idea, una obra o una organización.</h2><p>Las fuentes se consultan en paralelo. Los resultados se deduplican por DOI, URL o título, sin calcular un ranking de calidad.</p></div>
        <form className="audit-query-form" onSubmit={searchResearch}><label htmlFor="research-query">Consulta</label><div className="audit-query-row"><input id="research-query" value={query} onChange={e=>setQuery(e.target.value)} maxLength={180} placeholder="Ej. responsible AI governance, TAMV, reproducible software…" required/><select aria-label="Tipo de búsqueda" value={researchType} onChange={e=>setResearchType(e.target.value as 'research'|'organizations')}><option value="research">Publicaciones y resultados</option><option value="organizations">Organizaciones (ROR)</option></select><button className="button button-primary" disabled={searchBusy} type="submit">{searchBusy?'Consultando…':'Buscar'} <ArrowRight aria-hidden="true"/></button></div></form>
        {searchError && <div className="form-alert error" role="alert">{searchError}</div>}
        {searchResult && <div className="audit-results"><div className="audit-result-summary"><strong>{searchResult.results.length} registros normalizados</strong><span>Consulta: “{searchResult.query}”</span></div><div className="provider-status-grid">{searchResult.providers.map(provider=><article key={provider.id}><span className={'provider-status status-'+provider.status.replace(/[^a-z]+/g,'-')}>{provider.status}</span><strong>{provider.name}</strong><small>{provider.count} resultados</small><p>{provider.note}</p></article>)}</div>
          {searchResult.results.length===0 ? <div className="form-alert">No hubo coincidencias en los conectores consultados. Prueba sinónimos o abre las fuentes manualmente.</div> : <div className="research-result-list">{searchResult.results.map(item=><article key={item.id}><div className="research-result-top"><span>{item.provider}</span>{item.year&&<span>{item.year}</span>}</div><h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title} <ArrowUpRight aria-hidden="true"/></a></h3><p>{item.authors.slice(0,5).join(', ')||'Autoría no recuperada'}{item.venue?' · '+item.venue:''}</p><div className="research-result-tags">{item.doi&&<span>DOI: {item.doi}</span>}{item.citedByCount!==null&&<span>{item.citedByCount} citas reportadas</span>}{item.license&&<span>Licencia reportada</span>}</div><small>{item.evidenceClass}</small></article>)}</div>}
          <p className="audit-method">{searchResult.methodology}</p><div className="audit-external-links">{Object.entries(searchResult.sourceLinks||{}).map(([name,url])=><a key={name} href={url} target="_blank" rel="noopener noreferrer">Abrir {name} ↗</a>)}</div>
        </div>}
      </section>}

      {tab==='doi' && <section className="audit-panel" aria-label="Auditoría de DOI">
        <div className="audit-panel-heading"><span>02 / METADATOS E INTEGRIDAD</span><h2>Compara el mismo DOI en diferentes fuentes.</h2><p>Contrasta Crossref, DataCite y OpenAlex. Cuando no se encuentra un DOI en un registro, se señala como ausente allí; no como inexistente universalmente.</p></div>
        <form className="audit-query-form" onSubmit={auditDoi}><label htmlFor="doi-input">DOI o URL DOI</label><div className="audit-query-row"><input id="doi-input" value={doi} onChange={e=>setDoi(e.target.value)} maxLength={300} placeholder="10.xxxx/xxxxx o https://doi.org/…" required/><button className="button button-primary" disabled={auditBusy} type="submit">{auditBusy?'Cotejando…':'Verificar DOI'} <ArrowRight aria-hidden="true"/></button></div><label className="check-row audit-persist-check"><input type="checkbox" checked={persist} onChange={e=>setPersist(e.target.checked)}/><span>Guardar instantánea en Supabase vinculada a mi TAMV ID. Requiere iniciar sesión, registro completado y persistencia habilitada.</span></label></form>
        {auditError&&<div className="form-alert error" role="alert">{auditError}</div>}
        {audit&&<div className="audit-results">
          <div className="doi-audit-heading"><div><span className="eyebrow">DOI AUDITADO</span><h3>{audit.doi}</h3><p>Recuperado: {new Date(audit.retrievedAt).toLocaleString('es-MX')}</p></div><div className="audit-hash"><span>SHA-256 DE LA INSTANTÁNEA</span><code>{audit.auditHash}</code><button type="button" onClick={()=>navigator.clipboard?.writeText(audit.auditHash)}>Copiar hash</button></div></div>
          <div className="readiness-score"><div className="score-ring"><strong>{audit.readiness.score}</strong><span>/100</span></div><div><span className="eyebrow">ISABELLA · TRIAJE DOCUMENTAL</span><h3>{audit.readiness.label}</h3><p>Este índice refleja completitud del expediente según los criterios mostrados; no es un puntaje científico, financiero ni legal.</p></div></div>
          <div className="score-components">{Object.entries(audit.readiness.components).map(([name,value])=><article key={name}><span>{name.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}</span><strong>{value.score}/100</strong><div className="score-track"><i style={{width:value.score+'%'}}/></div><small>Peso {Math.round(value.weight*100)}%</small></article>)}</div>
          <div className="metadata-comparison">{audit.records.map(record=><article key={record.provider}><div className="metadata-source"><strong>{record.provider}</strong><span className={'provider-status status-'+record.status}>{record.status}</span></div>{record.title&&<h3>{record.title}</h3>}<dl><dt>Autoría</dt><dd>{record.authors.join(', ')||'No recuperada'}</dd><dt>Año</dt><dd>{record.year||'No recuperado'}</dd><dt>Editorial / depósito</dt><dd>{record.publisher||'No recuperado'}</dd><dt>Tipo</dt><dd>{record.resourceType||'No recuperado'}</dd><dt>Licencia</dt><dd>{record.license||'No recuperada'}</dd></dl><p>{record.note}</p><a href={record.url} target="_blank" rel="noopener noreferrer">Abrir registro fuente ↗</a></article>)}</div>
          <div className="next-actions"><h3>Próximas acciones recomendadas</h3>{audit.readiness.nextActions.map(action=><p key={action}><CheckCircle2 aria-hidden="true"/>{action}</p>)}</div>
          <div className="form-alert">{audit.persistence.message}</div><p className="audit-method">{audit.limitation}</p><button className="button button-ghost" type="button" onClick={()=>{const payload=JSON.stringify(audit,null,2);const blob=new Blob([payload],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='tamv-doi-audit-'+audit.doi.replace(/[^a-zA-Z0-9.-]/g,'_')+'.json';a.click();URL.revokeObjectURL(url);}}><ArrowDownToLine aria-hidden="true"/> Descargar informe JSON</button>
        </div>}
      </section>}

      {tab==='ip' && <section className="audit-panel" aria-label="Búsqueda preliminar de patentes e IP">
        <div className="audit-panel-heading"><span>03 / ESTADO DE LA TÉCNICA E IP</span><h2>Busca patentes relacionadas con un módulo o invención.</h2><p>La búsqueda EPO OPS funciona cuando se configuran credenciales en el servidor. Las otras fuentes enlazan directamente a portales oficiales conforme a sus términos.</p></div>
        <form className="audit-query-form" onSubmit={auditPatents}><label htmlFor="patent-query">Tecnología, frase de título o concepto</label><div className="audit-query-row"><input id="patent-query" value={patentQuery} onChange={e=>setPatentQuery(e.target.value)} maxLength={160} placeholder="Ej. privacy-preserving AI orchestration" required/><button className="button button-primary" disabled={patentBusy} type="submit">{patentBusy?'Consultando…':'Buscar anterioridad'} <ArrowRight aria-hidden="true"/></button></div></form>
        {patentError&&<div className="form-alert error" role="alert">{patentError}</div>}
        {patents&&<div className="audit-results"><div className="audit-result-summary"><strong>Panorama preliminar de IP</strong><span>Consulta: “{patents.query}” · {new Date(patents.checkedAt).toLocaleString('es-MX')}</span></div><div className="patent-provider-grid">{patents.providers.map(provider=><article key={provider.provider}><div className="metadata-source"><strong>{provider.provider}</strong><span className={'provider-status status-'+provider.status.replace(/[^a-z]+/g,'-')}>{provider.status}</span></div><p>{provider.note}</p>{provider.results?.map(item=><div className="patent-hit" key={item.publicationNumber}><strong>{item.publicationNumber}</strong><span>{item.title}</span></div>)}<a href={provider.url} target="_blank" rel="noopener noreferrer">Abrir fuente oficial ↗</a></article>)}</div><div className="legal-notice"><strong>Uso responsable:</strong> las coincidencias son pistas para revisión humana. No demuestran validez, infracción, novedad, titularidad ni libertad de operación.</div><ul className="audit-limits">{patents.limitations.map(item=><li key={item}>{item}</li>)}</ul></div>}
      </section>}

      {tab==='apis' && <section className="audit-panel" aria-label="Mapa de APIs y conectores">
        <div className="audit-panel-heading"><span>04 / INTEROPERABILIDAD</span><h2>Mapa de APIs, acceso y límites.</h2><p>Los estados indican la integración de esta aplicación, no una puntuación de los proveedores. Cada acceso está condicionado por las políticas y permisos de la fuente.</p></div>
        <div className="api-matrix">{apiMap.map(api=><article key={api.name}><div><span className="api-kind">{api.kind}</span><h3>{api.name}</h3><p>{api.note}</p></div><div className="api-status"><span>{api.state}</span><a href={api.url} target="_blank" rel="noopener noreferrer">Documentación oficial ↗</a></div></article>)}</div>
        <div className="legal-notice"><strong>Principio de auditoría:</strong> no se automatiza un portal mediante scraping si sus términos lo prohíben; no se evaden suscripciones; no se intenta convertir cobertura de datos en prueba de calidad. La integración se limita a APIs públicas, credenciales autorizadas y enlaces manuales.</div>
      </section>}
    </section>

    <section className="section-wrap audit-governance"><div><p className="eyebrow">GOBERNANZA DE LA EVIDENCIA</p><h2>Un expediente útil para investigación y transferencia.</h2><p>La capa organiza fuentes, detecta campos ausentes, mantiene hash de la instantánea y sugiere acciones. La adopción, revisión por pares, libertad de operación, patentabilidad, valoración y monetización requieren análisis específicos y fuentes externas independientes.</p></div><div className="governance-grid"><article><Database aria-hidden="true"/><h3>Procedencia</h3><p>Fuente, fecha de consulta, identificador y alcance de cada dato.</p></article><article><Fingerprint aria-hidden="true"/><h3>Identidad</h3><p>ORCID/ISNI como identificadores externos; TAMV ID como registro interno independiente.</p></article><article><KeyRound aria-hidden="true"/><h3>Permisos</h3><p>Las claves permanecen en Vercel server-side; las API secret no se envían al navegador.</p></article><article><CircleAlert aria-hidden="true"/><h3>Limitaciones</h3><p>Un resultado ausente no implica inexistencia. El algoritmo no sustituye a especialistas.</p></article></div></section>

    <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>© {new Date().getFullYear()} TAMV Online Network</span><span>Metadatos consultados bajo términos de sus fuentes.</span><Link href="/politica-editorial">Política editorial</Link><Link href="/privacidad">Privacidad</Link></div></div></footer>
  </main>;
}
