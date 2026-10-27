'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, CircleAlert, Gavel, ShieldCheck } from 'lucide-react';
import type { ReviewQueueItem } from '../revision/reviewer-console';

type Review={
 id:string;proposal_id:string;reviewer_tamv_id:string|null;reviewer_role:string;
 independence_declaration:Record<string,unknown>;domain_scores:Record<string,unknown>;
 recommendation:string;rationale:string;evidence_references:Array<{label:string;url:string}>;
 review_version:string;created_at:string;
};
type DecisionItem={proposal:ReviewQueueItem;reviews:Review[]};
const domainLabels:Record<string,string>={
 scientificValidity:'Validez científica',technicalRobustness:'Solidez técnica',security:'Seguridad',privacy:'Privacidad',
 ethics:'Ética',reproducibility:'Reproducibilidad',governance:'Gobernanza',socialImpact:'Impacto social',
 economicViability:'Viabilidad económica',scientificIntegrity:'Integridad científica',cognitiveReliability:'Fiabilidad cognitiva',
 metaEvaluation:'Metaevaluación',evidenceProvenance:'Procedencia',futureConsequences:'Consecuencias futuras',
};
const recommendationLabels:Record<string,string>={minor_revision:'Revisión menor',major_revision:'Revisión mayor',accept_with_conditions:'Recomendar aceptación condicionada',reject:'Recomendar rechazo',recuse:'Recusación'};

function latestEligible(reviews:Review[]){
 const latest=new Map<string,Review>();
 for(const review of reviews){if(review.reviewer_tamv_id&&!latest.has(review.reviewer_tamv_id))latest.set(review.reviewer_tamv_id,review);}
 return [...latest.values()].filter(review=>{
  const d=review.independence_declaration||{};
  return review.recommendation!=='recuse'&&d.hasConflict!==true&&d.financialInterest!==true&&d.involvedInDevelopment!==true&&d.recentCollaboration!==true&&!String(d.otherRelationship||'').trim();
 });
}
function scoreSummary(review:Review){
 const payload=review.domain_scores||{};
 const scores=payload.scores&&typeof payload.scores==='object'?payload.scores as Record<string,unknown>:{};
 const failures=Array.isArray(payload.criticalFailures)?payload.criticalFailures as string[]:[];
 return {scores,failures};
}
function ReviewBlock({review}:{review:Review}){
 const data=scoreSummary(review);
 return <details className="vetra-chair-review"><summary><span>{review.reviewer_tamv_id||'Revisor sin TAMV ID'} · {review.reviewer_role}</span><b>{recommendationLabels[review.recommendation]||review.recommendation}</b></summary>
  <p>{review.rationale}</p>
  <div className="vetra-chair-scores">{Object.entries(data.scores).map(([key,value])=><span key={key}>{domainLabels[key]||key}: <strong>{String(value)}/4</strong></span>)}</div>
  {data.failures.length>0&&<div className="vetra-chair-critical"><strong>Fallos críticos declarados</strong><ul>{data.failures.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
  {review.evidence_references?.length>0&&<div className="vetra-chair-evidence"><strong>Fuentes aportadas</strong>{review.evidence_references.map(ref=><a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer">{ref.label} ↗</a>)}</div>}
  <small>Registrada: {new Date(review.created_at).toLocaleString('es-MX')} · Versión {review.review_version}</small>
 </details>;
}
function DecisionEditor({item,onDecided}:{item:DecisionItem;onDecided:(id:string)=>void}){
 const [status,setStatus]=useState('major_revision');
 const [rationale,setRationale]=useState('');
 const [conditions,setConditions]=useState('');
 const [appealDays,setAppealDays]=useState(30);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const eligible=latestEligible(item.reviews);
 const covered=new Set<string>(),critical:string[]=[];
 for(const review of eligible){const d=scoreSummary(review);Object.keys(d.scores).forEach(k=>covered.add(k));critical.push(...d.failures);}
 const domainKeys=Object.keys(domainLabels);
 const missing=domainKeys.filter(x=>!covered.has(x));
 const criticalUnique=[...new Set(critical)];
 const enough=eligible.length>=3&&missing.length===0;
 const independent=eligible.every(review=>{
  const d=review.independence_declaration||{};
  return d.declarationSubmitted===true;
 });
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError('');setSuccess('');
  if(!enough){setError('No se puede decidir hasta contar con al menos tres revisiones independientes que cubran los catorce dominios.');return;}
  if(!independent){setError('Falta declaración de independencia en una o más revisiones.');return;}
  if(status==='accepted_with_conditions'&&conditions.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).length===0){setError('La aceptación condicionada necesita al menos una condición escrita.');return;}
  if(status==='accepted_with_conditions'&&criticalUnique.length>0){setError('Existen fallos críticos declarados; no puede emitirse aceptación condicionada hasta que se mitiguen y se reevalue.');return;}
  if(rationale.trim().length<100){setError('La motivación necesita al menos 100 caracteres y debe referirse a la evidencia.');return;}
  setBusy(true);
  try{
   const response=await fetch('/api/vetra/decisions',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify({
    proposalId:item.proposal.id,decisionStatus:status,rationale,
    conditions:conditions.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),appealWindowDays:appealDays,
   })});
   const payload=await response.json();
   if(!response.ok||!payload.ok)throw new Error(payload.error||'No fue posible registrar la decisión.');
   setSuccess('Decisión registrada. Referencia: '+payload.decision.id);
   onDecided(item.proposal.id);
  }catch(e){setError(e instanceof Error?e.message:'Error al registrar la decisión.');}
  finally{setBusy(false);}
 }
 return <article className="vetra-decision-card">
  <div className="vetra-decision-card-head"><span>{item.proposal.proposal_code} · {item.proposal.status}</span><span>{item.proposal.risk_screening_status}</span></div>
  <h2>{item.proposal.title}</h2><p className="vetra-decision-abstract">{item.proposal.abstract}</p>
  <div className="vetra-decision-count"><strong>{eligible.length} revisiones independientes utilizables</strong><span>{covered.size}/14 dominios cubiertos</span></div>
  {item.reviews.length>0?<div className="vetra-chair-reviews">{item.reviews.map(review=><ReviewBlock key={review.id} review={review}/>)}</div>:<div className="form-alert">Todavía no hay revisiones registradas.</div>}
  {criticalUnique.length>0&&<div className="vetra-chair-critical"><strong>Fallos críticos pendientes</strong><ul>{criticalUnique.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}
  {missing.length>0&&<div className="form-alert">Dominios sin cobertura: {missing.map(x=>domainLabels[x]||x).join(', ')}.</div>}
  <form className="vetra-decision-form" onSubmit={submit}>
   <p className="eyebrow">DICTAMEN HUMANO FINAL</p>
   <label className="vetra-field"><span>Estado de la decisión</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="minor_revision">Revisión menor requerida</option><option value="major_revision">Revisión mayor requerida</option><option value="accepted_with_conditions">Aceptación con condiciones</option><option value="rejected">Rechazada con motivos</option><option value="suspended">Suspendida</option><option value="withdrawn">Retirada</option></select></label>
   <label className="vetra-field"><span>Motivación de la decisión (mínimo 100 caracteres)</span><textarea minLength={100} maxLength={8000} rows={5} required value={rationale} onChange={e=>setRationale(e.target.value)} placeholder="Integra los hallazgos, los desacuerdos, los riesgos y la evidencia que sustenta la resolución."/></label>
   <label className="vetra-field"><span>Condiciones/acciones requeridas (una por línea)</span><textarea maxLength={12000} rows={3} value={conditions} onChange={e=>setConditions(e.target.value)} placeholder="Mitigación de riesgos, reproducción, corrección metodológica, etc."/></label>
   <label className="vetra-field"><span>Ventana de apelación (días)</span><select value={appealDays} onChange={e=>setAppealDays(Number(e.target.value))}><option value={15}>15 días</option><option value={30}>30 días</option><option value={45}>45 días</option><option value={60}>60 días</option><option value={90}>90 días</option></select></label>
   {error&&<div className="form-alert error" role="alert">{error}</div>}
   {success&&<div className="vetra-submission-success" role="status"><CheckCircle2 aria-hidden="true"/><p>{success}</p></div>}
   <button className="button button-primary" type="submit" disabled={busy||!enough||!independent}><Gavel aria-hidden="true"/>{busy?'Registrando…':'Registrar decisión humana'} <ArrowRight aria-hidden="true"/></button>
   <p className="vetra-small-print">La decisión quedará registrada de forma atómica con el cambio de estado. No es una certificación externa ni puede publicarse como acreditación.</p>
  </form>
 </article>;
}

export default function DecisionConsole({initialItems}:{initialItems:DecisionItem[]}){
 const [items,setItems]=useState(initialItems);
 return <div className="vetra-decision-list">
  <div className="vetra-review-queue-meta"><strong>{items.length} expedientes en estados revisables</strong><span>La decisión requiere tres revisores independientes, cobertura de los catorce dominios y conflictos comprobados.</span></div>
  {items.length===0?<div className="vetra-empty-state"><CheckCircle2 aria-hidden="true"/><h2>No hay expedientes en la cola</h2><p>No se encontraron propuestas que requieran una decisión final.</p></div>:items.map(item=><DecisionEditor key={item.proposal.id} item={item} onDecided={id=>setItems(old=>old.filter(x=>x.proposal.id!==id))}/>)}
 </div>;
}
