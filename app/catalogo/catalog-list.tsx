'use client';
import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';

export type CatalogRecord = {
  id: string; title: string; url: string; resourceType: string; sourceType: string;
  evidenceScope: string; reviewStatus: string; doi?: string; publicationDate?: string;
};
const labels: Record<string,string> = {
  'person-profile':'Perfil de persona',
  'software-profile':'Perfil de software',
  'repository-record':'Registro persistente',
  'professional-dissemination':'Divulgación profesional',
  'project-portal':'Portal de proyecto',
  'website-source-code':'Código fuente',
  'professional-profile':'Perfil profesional',
};
const reviewLabels: Record<string,string> = {
  'link-located':'Enlace localizado; metadatos por cotejar',
  'metadata-needs-individual-verification':'Metadatos por verificar en origen',
  'verify-original-metadata-before-formal-citation':'Cotejar antes de cita formal',
};

export default function CatalogList({ records }: { records: CatalogRecord[] }) {
  const [query,setQuery] = useState('');
  const [type,setType] = useState('all');
  const types = useMemo(()=>['all',...Array.from(new Set(records.map(r=>r.resourceType)))], [records]);
  const filtered = useMemo(()=>{
    const q=query.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
    return records.filter((r)=>{
      const text=[r.title,r.resourceType,r.sourceType,r.evidenceScope,r.reviewStatus,r.doi||''].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      return (type==='all'||r.resourceType===type)&&text.includes(q);
    });
  },[records,query,type]);
  return <div>
    <div className="catalog-toolbar"><label className="catalog-search"><Search aria-hidden="true"/><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar título, DOI, tipo o alcance de evidencia" aria-label="Buscar en el catálogo"/></label>
    <label className="catalog-filter-label">Tipo de registro <select value={type} onChange={e=>setType(e.target.value)}><option value="all">Todos los tipos</option>{types.filter(t=>t!=='all').map(t=><option value={t} key={t}>{labels[t]||t}</option>)}</select></label></div>
    <p className="catalog-count" aria-live="polite">Mostrando {filtered.length} de {records.length} registros. Los estados indican el nivel de revisión del catálogo, no una calificación científica.</p>
    <div className="catalog-cards">{filtered.map((record)=><article className="catalog-record" key={record.id}>
      <div className="catalog-record-meta"><span>{labels[record.resourceType]||record.resourceType}</span><span>{record.reviewStatus}</span></div>
      <h2>{record.title}</h2><p>{record.evidenceScope}</p>
      {record.doi&&<code className="catalog-doi">DOI: {record.doi}</code>}
      <div className="catalog-source"><span>{record.sourceType}</span>{record.publicationDate&&<span>{record.publicationDate}</span>}</div>
      <a href={record.url} target="_blank" rel="noopener noreferrer">Abrir fuente original <ExternalLink aria-hidden="true"/></a>
      <small>{reviewLabels[record.reviewStatus]||'Verifica los metadatos en la fuente original.'}</small>
    </article>)}</div>
    {filtered.length===0&&<div className="form-alert">No se encontraron registros. Prueba con otro término o selecciona todos los tipos.</div>}
  </div>;
}
