'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, CheckCircle2, FileSearch, ShieldAlert } from 'lucide-react';

export type ReviewQueueItem = {
  id:string; proposal_code:string; submitter_display_name:string; title:string; proposal_type:string; maturity_stage:string;
  abstract:string; problem_statement:string; contribution_claim:string; methodology:string; reproducibility_plan:string;
  sources_and_artifacts:Array<{label:string;url:string}>; ethics_and_harm:string; privacy_and_data:string;
  security_plan:string; rights_and_ip:string; sustainability_plan:string; funding_and_conflicts:string;
  filter_declarations:Record<string,unknown>; status:string; risk_screening_status:string; created_at:string;
};

const domains:Array<{key:string;label:string}>= [
 {key:'scientificValidity',label:'Validez científica'},
 {key:'technicalRobustness',label:'Solidez técnica'},
 {key:'security',label:'Seguridad'},
 {key:'privacy',label:'Privacidad'},
 {key:'ethics',label:'Ética'},
 {key:'reproducibility',label:'Reproducibilidad'},
 {key:'governance',label:'Gobernanza'},
 {key:'socialImpact',label:'Impacto social'},
 {key:'economicViability',label:'Viabilidad económica'},
 {key:'scientificIntegrity',label:'Integridad científica'},
 {key:'cognitiveReliability',label:'Fiabilidad cognitiva de IA'},
 {key:'metaEvaluation',label:'Metaevaluación'},
 {key:'evidenceProvenance',label:'Evidencia y procedencia'},
 {key:'futureConsequences',label:'Consecuencias futuras'},
];

function linesToRefs(value:string):Array<{label:string;url:string}>{
 return value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(url=>{try{return {label:new URL(url).hostname,url};}catch{return {label:'Referencia inválida',url};}});
}
function Field({label,children}:{label:string;children:ReactNode}){
 return <label className="vetra-review-field"><span>{label}</span>{children}</label>;
}

function ReviewEditor({proposal,onSubmitted}:{proposal:ReviewQueueItem;onSubmitted:(id:string)=>void}){
 const [selected,setSelected]=useState<string[]>(['scientificValidity']);
 const [scores,setScores]=useState<Record<string,number>>({scientificValidity:3});
 const [hasConflict,setHasConflict]=useState(false);
 const [financialInterest,setFinancialInterest]=useState(false);
 const [involved,setInvolved]=useState(false);
 const [recent,setRecent]=useState(false);
 const [otherRelationship,setOtherRelationship]=useState('');
 const [recommendation,setRecommendation]=useState('major_revision');
 const [rationale,setRationale]=useState('');
 const [failures,setFailures]=useState('');
 const [references,setReferences]=useState('');
 const [reviewerRole,setReviewerRole]=useState('Revisión interdisciplinaria');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');

 function toggleDomain(key:string,checked:boolean){
  setSelected(current=>checked?[...new Set([...current,key])]:current.filter(x=>x!==key));
  setScores(current=>checked?{...current,[key]:current[key]??3}:Object.fromEntries(Object.entries(current).filter(([name])=>name!==key)));
 }

 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setError('');setSuccess('');
  if(!rationale.trim()||rationale.trim().length<100){setError('La justificación debe tener al menos 100 caracteres y referirse a evidencia concreta.');return;}
  const refs=linesToRefs(references);
  if(refs.some(r=>r.label==='Referencia inválida'||!r.url.startsWith('https://'))){setError('Corrige las referencias; usa una URL HTTPS por línea.');return;}
  if(!hasConflict&&!financialInterest&&!involved&&!recent&&!otherRelationship.trim()&&recommendation==='recuse'){setError('Explica la razón de recusación si no existe conflicto declarado.');return;}
  if((hasConflict||financialInterest||involved||recent||otherRelationship.trim())&&recommendation!=='recuse'){setError('Hay una relación declarada: selecciona recusación. No puntúes una propuesta en la que existe conflicto.');return;}
  if(recommendation!=='recuse'&&selected.length===0){setError('Selecciona al menos un dominio que puedas evaluar con competencia.');return;}
  setBusy(true);
  try{
   const response=await fetch('/api/vetra/reviews',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',cache:'no-store',body:JSON.stringify({
    proposalId:proposal.id,reviewerRole,independenceDeclaration:{hasConflict,financialInterest,involvedInDevelopment:involved,recentCollaboration:recent,otherRelationship,declarationSubmitted:true},
    domainScores:Object.fromEntries(selected.map(key=>[key,scores[key]??3])),criticalFailures:failures.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),
    recommendation,rationale,evidenceReferences:refs
   })});
   const data=await response.json();
   if(!response.ok||!data.ok)throw new Error(data.error||'No fue posible guardar la revisión.');
   setSuccess('Revisión registrada con referencia '+data.review.id+'. La decisión final corresponde al proceso humano de VETRA.');
   onSubmitted(proposal.id);
  }catch(e){setError(e instanceof Error?e.message:'Error al guardar la revisión.');}
  finally{setBusy(false);}
 }

 return <details className="vetra-review-card"><summary><div><span>{proposal.proposal_code} · {proposal.status}</span><h2>{proposal.title}</h2><small>{proposal.submitter_display_name} · {proposal.proposal_type.replaceAll('_',' ')} · {proposal.maturity_stage} · {new Date(proposal.created_at).toLocaleDateString('es-MX')}</small></div><FileSearch aria-hidden="true"/></summary>
  <div className="vetra-review-content">
   <div className="vetra-review-document"><h3>Resumen</h3><p>{proposal.abstract}</p><h3>Problema</h3><p>{proposal.problem_statement}</p><h3>Contribución reclamada</h3><p>{proposal.contribution_claim}</p><h3>Método</h3><p>{proposal.methodology}</p><h3>Reproducibilidad</h3><p>{proposal.reproducibility_plan}</p><h3>Ética y posibles daños</h3><p>{proposal.ethics_and_harm}</p><h3>Privacidad y datos</h3><p>{proposal.privacy_and_data}</p><h3>Seguridad</h3><p>{proposal.security_plan}</p><h3>Derechos e IP</h3><p>{proposal.rights_and_ip}</p><h3>Sostenibilidad</h3><p>{proposal.sustainability_plan}</p><h3>Financiación y conflictos declarados</h3><p>{proposal.funding_and_conflicts}</p>{proposal.sources_and_artifacts?.length>0&&<><h3>Fuentes declaradas</h3><ul>{proposal.sources_and_artifacts.map(ref=><li key={ref.url}><a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.label} ↗</a></li>)}</ul></>}</div>
   <form className="vetra-review-form" onSubmit={submit}>
    <p className="eyebrow">EVALUACIÓN INDEPENDIENTE · NO ES AÚN DECISIÓN FINAL</p>
    <Field label="Ámbito en el que revisas"><select value={reviewerRole} onChange={e=>setReviewerRole(e.target.value)}><option>Revisión interdisciplinaria</option><option>Rigor científico y método</option><option>Estadística y reproducibilidad</option><option>Arquitectura y software</option><option>Seguridad de sistemas</option><option>Privacidad y ética</option><option>Propiedad intelectual y licencias</option><option>Viabilidad e impacto social</option><option>Gobernanza e integridad</option><option>Fiabilidad de IA</option></select></Field>
    <div className="vetra-conflict-box"><h3>Independencia y conflicto de interés</h3><p>Declara relaciones económicas, participación en el desarrollo, colaboración reciente o cualquier relación que pueda afectar la independencia. Si existe conflicto material, recúsate.</p>
     <label><input type="checkbox" checked={hasConflict} onChange={e=>setHasConflict(e.target.checked)}/> Tengo un conflicto o relación que puede afectar mi independencia.</label>
     <label><input type="checkbox" checked={financialInterest} onChange={e=>setFinancialInterest(e.target.checked)}/> Tengo interés financiero directo o indirecto relacionado.</label>
     <label><input type="checkbox" checked={involved} onChange={e=>setInvolved(e.target.checked)}/> Participé en el desarrollo, autoría o financiación de este objeto.</label>
     <label><input type="checkbox" checked={recent} onChange={e=>setRecent(e.target.checked)}/> Existe colaboración reciente u otra relación relevante.</label>
     <Field label="Otras relaciones o explicación de recusación"><textarea maxLength={1000} rows={2} value={otherRelationship} onChange={e=>setOtherRelationship(e.target.value)} placeholder="Describe otra relación relevante; si no existe, déjalo vacío."/></Field>
    </div>
    <Field label="Dominios que tienes competencia para evaluar"><div className="vetra-domain-pick">{domains.map(domain=><label key={domain.key}><input type="checkbox" checked={selected.includes(domain.key)} onChange={e=>toggleDomain(domain.key,e.target.checked)}/><span>{domain.label}</span></label>)}</div></Field>
    {selected.length>0&&recommendation!=='recuse'&&<div className="vetra-score-grid"><h3>Notas por dominio</h3><p>0 = crítico/no sustentado; 1 = insuficiente; 2 = parcial; 3 = adecuado al alcance; 4 = robusto con evidencia triangulada.</p>{selected.map(key=><label key={key}><span>{domains.find(d=>d.key===key)?.label}</span><select value={scores[key]??3} onChange={e=>setScores(old=>({...old,[key]:Number(e.target.value)}))}><option value={0}>0 · Crítico / no sustentado</option><option value={1}>1 · Insuficiente</option><option value={2}>2 · Parcial</option><option value={3}>3 · Adecuado</option><option value={4}>4 · Robusto</option></select></label>)}</div>}
    <Field label="Fallos críticos no mitigados (uno por línea)"><textarea rows={3} maxLength={3000} value={failures} onChange={e=>setFailures(e.target.value)} placeholder="Si existen, describe el fallo y la evidencia. Deja vacío si no has identificado uno."/></Field>
    <Field label="Recomendación individual"><select value={recommendation} onChange={e=>setRecommendation(e.target.value)}><option value="minor_revision">Revisión menor</option><option value="major_revision">Revisión mayor</option><option value="accept_with_conditions">Recomendar aceptación condicionada</option><option value="reject">Recomendar rechazo</option><option value="recuse">Recusarme</option></select></Field>
    <Field label="Justificación del dictamen (mínimo 100 caracteres)"><textarea required minLength={100} maxLength={8000} rows={6} value={rationale} onChange={e=>setRationale(e.target.value)} placeholder="Cita la evidencia, relaciona el hallazgo con el criterio y explica la acción necesaria."/></Field>
    <Field label="Referencias de evidencia externas (una URL HTTPS por línea)"><textarea rows={3} maxLength={6000} value={references} onChange={e=>setReferences(e.target.value)} placeholder="https://..."/></Field>
    {error&&<div className="form-alert error" role="alert">{error}</div>}
    {success&&<div className="vetra-submission-success" role="status"><CheckCircle2 aria-hidden="true"/><p>{success}</p></div>}
    <button className="button button-primary" type="submit" disabled={busy}>{busy?'Guardando…':'Registrar revisión independiente'} <ArrowRight aria-hidden="true"/></button>
    <p className="vetra-small-print"><ShieldAlert aria-hidden="true"/> Los puntajes son parte del expediente interno. No certifiques por cuenta propia ni compartas esta revisión fuera de los canales definidos.</p>
   </form>
  </div>
 </details>;
}

export default function ReviewerConsole({initialItems}:{initialItems:ReviewQueueItem[]}){
 const [items,setItems]=useState(initialItems);
 return <div className="vetra-review-queue">
  <div className="vetra-review-queue-meta"><strong>{items.length} expedientes disponibles</strong><span>Las propuestas completas pueden contener información confidencial. Trátalas como material de revisión.</span></div>
  {items.length===0?<div className="vetra-empty-state"><CheckCircle2 aria-hidden="true"/><h2>La cola está vacía</h2><p>No hay propuestas abiertas en los estados configurados. Una revisión puede añadirse cuando exista una nueva propuesta o asignación.</p></div>:items.map(item=><ReviewEditor key={item.id} proposal={item} onSubmitted={id=>setItems(old=>old.filter(p=>p.id!==id))}/>)}
 </div>;
}
