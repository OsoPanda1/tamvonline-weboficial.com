'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent, type WheelEvent } from 'react';
import {
  Activity, AlertTriangle, ArrowDownToLine, ArrowRight, Atom, CheckCircle2, CircleHelp,
  Compass, FileCheck2, GitBranch, Globe2, Layers3, LockKeyhole, Network, Orbit,
  Pause, Play, Plus, RotateCcw, Search, ShieldAlert, ShieldCheck, SlidersHorizontal,
  X, Zap,
} from 'lucide-react';
import {
  hcuAtoms, hcuDomains, hcuDomainNodes, hcuHyperedges, hcuInitialNodes, hcuSources,
  type HcuDomainId, type HcuNode,
} from '@/lib/hcu-model';

type ViewMode='topology'|'hyperedges'|'pods'|'risk'|'evidence';
type Point={x:number;y:number;z:number;radius:number};
type XY={x:number;y:number};
const domainColor=Object.fromEntries(hcuDomains.map(domain=>[domain.id,domain.color])) as Record<HcuDomainId,string>;
const AXES:Array<{key:'influence'|'risk'|'evidence'|'uncertainty'|'futurePotential';label:string;short:string}>=[
 {key:'influence',label:'Influencia sistémica',short:'X'},
 {key:'risk',label:'Riesgo potencial',short:'Y'},
 {key:'evidence',label:'Cobertura de evidencia',short:'Z'},
 {key:'uncertainty',label:'Incertidumbre',short:'Q'},
 {key:'futurePotential',label:'Potencial de transformación',short:'Ω'},
];

function nodePosition(node:HcuNode,nodes:HcuNode[],year:number):{x:number;y:number;z:number}{
 if(node.type==='core')return {x:0,y:0,z:0};
 if(node.type==='domain'){
  const index=hcuDomains.findIndex(d=>d.id===node.domainId);
  const angle=(index/6)*Math.PI*2-Math.PI/2;
  return {x:Math.cos(angle)*.55,y:Math.sin(angle)*.49,z:Math.sin(angle*1.7)*.23};
 }
 const domainIndex=hcuDomains.findIndex(d=>d.id===node.domainId);
 const angle=(domainIndex/6)*Math.PI*2-Math.PI/2;
 const atomsInDomain=nodes.filter(n=>(n.type==='atom'||n.type==='pod')&&n.domainId===node.domainId);
 const atomIndex=Math.max(0,atomsInDomain.findIndex(n=>n.id===node.id));
 const localAngle=(atomIndex/Math.max(1,atomsInDomain.length))*Math.PI*2+angle*.35;
 const radius=node.type==='pod'?.20:.19;
 return {
  x:Math.cos(angle)*.55+Math.cos(localAngle)*radius,
  y:Math.sin(angle)*.49+Math.sin(localAngle)*radius,
  z:Math.sin(angle*1.7)*.23+Math.cos(localAngle*1.2)*.17,
 };
}

function makeScenarioWeights(year:number){
 const progress=Math.max(0,Math.min(1,(year-2026)/24));
 const controlled=Math.round(50-20*progress);
 const structural=Math.round(35+5*progress);
 return [
  {id:'A',label:'Transición gobernada',weight:controlled,description:year<2035?'Controles, adopción gradual y revisión de impactos.':'Instituciones y métricas maduran, pero el ritmo depende de evidencia y cooperación.'},
  {id:'B',label:'Transformación estructural',weight:structural,description:year<2035?'Cambios en capacidades, organización del trabajo y servicios.':'Reconfiguración de servicios e infraestructuras; distribución de resultados todavía incierta.'},
  {id:'C',label:'Disrupción y tensiones',weight:100-controlled-structural,description:year<2035?'Adopción desigual, concentración de beneficios y riesgos emergentes.':'Dependencias sistémicas y consecuencias de segundo orden exigen capacidad de reversión.'},
 ];
}

function projectPoint(node:HcuNode,nodes:HcuNode[],width:number,height:number,rotation:XY,zoom:number,year:number):Point{
 const point=nodePosition(node,nodes,year);
 const cosY=Math.cos(rotation.x),sinY=Math.sin(rotation.x),cosX=Math.cos(rotation.y),sinX=Math.sin(rotation.y);
 const rx=point.x*cosY-point.z*sinY;
 const rz=point.x*sinY+point.z*cosY;
 const ry=point.y*cosX-rz*sinX;
 const z=point.y*sinX+rz*cosX;
 const perspective=1+z*.15;
 const scale=Math.min(width,height)*.34*zoom*perspective;
 const radius=node.type==='core'?10:node.type==='domain'?7.1:node.type==='pod'?6.4:4.4;
 return {x:width/2+rx*scale,y:height/2+ry*scale,z,radius:radius*(.83+perspective*.17)};
}

export default function HcuUniverse(){
 const canvasRef=useRef<HTMLCanvasElement|null>(null);
 const hostRef=useRef<HTMLDivElement|null>(null);
 const rotationRef=useRef<XY>({x:.16,y:-.08});
 const zoomRef=useRef(1);
 const dragRef=useRef<{x:number;y:number;rotation:XY;pointerId:number}|null>(null);
 const positionsRef=useRef<Map<string,Point>>(new Map());
 const [nodes,setNodes]=useState<HcuNode[]>(hcuInitialNodes);
 const [selectedId,setSelectedId]=useState('omega-core');
 const [viewMode,setViewMode]=useState<ViewMode>('topology');
 const [query,setQuery]=useState('');
 const [year,setYear]=useState(2026);
 const [autoRotate,setAutoRotate]=useState(true);
 const [showLabels,setShowLabels]=useState(true);
 const [quarantined,setQuarantined]=useState<string[]>([]);
 const [podName,setPodName]=useState('');
 const [podDomain,setPodDomain]=useState<HcuDomainId>('ai');
 const [showPodForm,setShowPodForm]=useState(false);
 const [notice,setNotice]=useState('');
 const [helpOpen,setHelpOpen]=useState(false);
 const [loadingExport,setLoadingExport]=useState(false);

 const selected=nodes.find(node=>node.id===selectedId)||nodes[0];
 const matchingNodes=useMemo(()=>{
  const term=query.trim().toLocaleLowerCase('es-MX');
  if(!term)return [];
  return nodes.filter(node=>(node.label+' '+node.description+' '+node.id).toLocaleLowerCase('es-MX').includes(term)).slice(0,7);
 },[nodes,query]);
 const scenarioWeights=useMemo(()=>makeScenarioWeights(year),[year]);
 const hcuAtomsCount=nodes.filter(node=>node.type==='atom').length;
 const podCount=nodes.filter(node=>node.type==='pod').length;
 const selectedColor=selected?.domainId?domainColor[selected.domainId]:'#c5e9ff';

 useEffect(()=>{
  const canvas=canvasRef.current,host=hostRef.current;
  if(!canvas||!host)return;
  const context=canvas.getContext('2d',{alpha:false});
  if(!context)return;
  let frame=0,alive=true,lastTime=0;
  const resize=()=>{
   const rect=host.getBoundingClientRect();
   const dpr=Math.min(2,window.devicePixelRatio||1);
   const width=Math.max(320,Math.floor(rect.width));
   const height=Math.max(390,Math.floor(Math.min(710,Math.max(460,rect.width*.65))));
   canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
   canvas.style.width=width+'px';canvas.style.height=height+'px';
   context.setTransform(dpr,0,0,dpr,0,0);
  };
  resize();
  const observer=new ResizeObserver(resize);observer.observe(host);
  const draw=(timestamp:number)=>{
   if(!alive)return;
   if(autoRotate&&!dragRef.current&&timestamp-lastTime>20)rotationRef.current.x+=.0018;
   lastTime=timestamp;
   const width=canvas.clientWidth||host.clientWidth;
   const height=canvas.clientHeight||460;
   context.clearRect(0,0,width,height);
   const bg=context.createLinearGradient(0,0,width,height);bg.addColorStop(0,'#07141f');bg.addColorStop(.52,'#07101a');bg.addColorStop(1,'#03080f');
   context.fillStyle=bg;context.fillRect(0,0,width,height);
   const glow=context.createRadialGradient(width*.5,height*.48,4,width*.5,height*.48,Math.max(width,height)*.55);
   glow.addColorStop(0,'rgba(46,106,147,.15)');glow.addColorStop(.65,'rgba(20,52,79,.055)');glow.addColorStop(1,'rgba(0,0,0,0)');
   context.fillStyle=glow;context.fillRect(0,0,width,height);
   context.lineWidth=.6;context.strokeStyle='rgba(112,166,202,.075)';
   for(let i=1;i<=5;i++){context.beginPath();context.ellipse(width/2,height/2,Math.min(width,height)*.12*i,Math.min(width,height)*.07*i,rotationRef.current.x*.12,0,Math.PI*2);context.stroke();}
   context.fillStyle='rgba(188,225,246,.36)';
   for(let i=0;i<72;i++){
    const x=((i*97.13)%1000)/1000*width,y=((i*173.7+43)%1000)/1000*height;
    const r=.35+(i%4)*.12;context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fill();
   }
   const positions=new Map<string,Point>();
   for(const node of nodes)positions.set(node.id,projectPoint(node,nodes,width,height,rotationRef.current,zoomRef.current,year));
   positionsRef.current=positions;
   const activeIds=new Set(nodes.filter(n=>(n.type==='atom'||n.type==='pod')&&n.domainId).map(n=>n.id));
   const drawLine=(start:Point,end:Point,color:string,alpha:number,widthLine:number)=>{
    context.save();context.globalAlpha=alpha;context.strokeStyle=color;context.lineWidth=widthLine;context.beginPath();context.moveTo(start.x,start.y);
    const bendX=(start.x+end.x)/2+(height/2-(start.y+end.y)/2)*.08;
    const bendY=(start.y+end.y)/2+(end.x-start.x)*.07;
    context.quadraticCurveTo(bendX,bendY,end.x,end.y);context.stroke();context.restore();
   };
   // Core-to-domain structure is shown as a low-emphasis scaffold; the hyperedge mode adds multi-member relations.
   const core=positions.get('omega-core');
   if(core) for(const domain of hcuDomainNodes){
    const point=positions.get(domain.id);if(!point)continue;
    drawLine(core,point,domain.domainId?domainColor[domain.domainId]:'#80badb',viewMode==='topology'?.29:.12,.75);
    const atoms=nodes.filter(n=>(n.type==='atom'||n.type==='pod')&&n.domainId===domain.domainId);
    for(const atom of atoms){const end=positions.get(atom.id);if(end)drawLine(point,end,domain.domainId?domainColor[domain.domainId]:'#80badb',viewMode==='topology'?.36:.11,.65);}
   }
   if(viewMode==='hyperedges'||viewMode==='evidence'){
    for(const edge of hcuHyperedges){
     const members=edge.nodeIds.map(id=>positions.get(id)).filter((p):p is Point=>Boolean(p));
     if(members.length<3)continue;
     const centroid={x:members.reduce((a,p)=>a+p.x,0)/members.length,y:members.reduce((a,p)=>a+p.y,0)/members.length,z:0,radius:1};
     context.save();context.strokeStyle=viewMode==='evidence'?'rgba(127,220,205,.25)':'rgba(121,212,242,.46)';context.fillStyle=viewMode==='evidence'?'rgba(127,220,205,.10)':'rgba(121,212,242,.12)';context.lineWidth=viewMode==='hyperedges'?1.3:.9;
     context.beginPath();members.forEach((p,i)=>{if(i===0)context.moveTo(p.x,p.y);else context.lineTo(p.x,p.y);});context.closePath();context.fill();context.stroke();
     context.beginPath();context.arc(centroid.x,centroid.y,Math.max(3,members.length*1.2),0,Math.PI*2);context.fill();
     for(const point of members){context.beginPath();context.moveTo(centroid.x,centroid.y);context.quadraticCurveTo((centroid.x+point.x)/2+9,(centroid.y+point.y)/2-9,point.x,point.y);context.stroke();}
     context.restore();
    }
   }
   const connectedEdges=new Set<string>();
   if(selected)for(const edge of hcuHyperedges)if(edge.nodeIds.includes(selected.id))edge.nodeIds.forEach(id=>connectedEdges.add(id));
   const term=query.trim().toLowerCase();
   const toDraw=[...nodes].sort((a,b)=>(positions.get(a.id)?.z||0)-(positions.get(b.id)?.z||0));
   for(const node of toDraw){
    const point=positions.get(node.id);if(!point)continue;
    const color=node.type==='core'?'#d8f1ff':node.domainId?domainColor[node.domainId]:'#8fd7fa';
    const isSelected=node.id===selectedId,isQuarantined=quarantined.includes(node.id);
    const isMatched=term&&(node.label+' '+node.description+' '+node.id).toLowerCase().includes(term);
    const isRisk=viewMode==='risk'&&node.axes.risk>=.63;
    const isEvidence=viewMode==='evidence'&&node.evidenceStatus.toLowerCase().includes('fuente');
    const fade=quarantined.length>0&&!isQuarantined&&!connectedEdges.has(node.id)?.24:1;
    context.save();context.globalAlpha=fade;
    if(isSelected||isMatched||isQuarantined||isRisk){
     context.beginPath();context.arc(point.x,point.y,point.radius*(isSelected?3.4:2.6),0,Math.PI*2);
     context.fillStyle=isQuarantined?'rgba(244,108,119,.12)':isRisk?'rgba(244,161,117,.12)':color+'21';context.fill();
     context.strokeStyle=isQuarantined?'rgba(255,124,132,.85)':isSelected?'rgba(217,242,255,.87)':color+'aa';context.lineWidth=isSelected?1.2:.8;context.stroke();
    }
    if(viewMode==='pods'&&(node.type==='pod'||node.type==='atom')){
     context.beginPath();context.arc(point.x,point.y,point.radius*2.3,0,Math.PI*2);context.strokeStyle=isQuarantined?'#f47b85':color;context.setLineDash([2,3]);context.lineWidth=.75;context.stroke();context.setLineDash([]);
    }
    const grad=context.createRadialGradient(point.x-point.radius*.25,point.y-point.radius*.35,0,point.x,point.y,point.radius*1.55);
    grad.addColorStop(0,isQuarantined?'#fff1f2':color);grad.addColorStop(.6,isQuarantined?'#f47b85':color);grad.addColorStop(1,'rgba(14,40,59,.78)');
    context.beginPath();context.arc(point.x,point.y,point.radius*(isSelected?1.25:1),0,Math.PI*2);context.fillStyle=grad;context.fill();
    if(node.type==='core'){
      context.beginPath();context.arc(point.x,point.y,point.radius*2.1,0,Math.PI*2);context.strokeStyle='rgba(195,235,255,.65)';context.lineWidth=.8;context.stroke();
    }
    if(showLabels&&(node.type==='domain'||isSelected||isMatched||isQuarantined||(viewMode==='risk'&&isRisk))){
     context.font=isSelected?'600 11px system-ui':'500 9px system-ui';context.textAlign='left';context.textBaseline='middle';
     context.fillStyle=isQuarantined?'#ffc1c6':isSelected?'#e5f5ff':'#a8c1d3';
     context.fillText(node.shortLabel,point.x+point.radius+7,point.y-1);
    }
    context.restore();
   }
   context.save();context.font='9px system-ui';context.fillStyle='rgba(127,163,188,.75)';context.textAlign='left';
   context.fillText('TAMV Ω∞ HCU / MODELO CONCEPTUAL',17,height-33);context.fillStyle='rgba(116,151,176,.65)';context.fillText('ROTACIÓN INTERACTIVA · PROYECCIÓN 3D VISUAL',17,height-17);context.restore();
   frame=requestAnimationFrame(draw);
  };
  frame=requestAnimationFrame(draw);
  return ()=>{alive=false;cancelAnimationFrame(frame);observer.disconnect();};
 },[nodes,selectedId,viewMode,query,year,autoRotate,showLabels,quarantined]);

 function selectNode(node:HcuNode){setSelectedId(node.id);setNotice('');}
 function pointerDown(event:PointerEvent<HTMLCanvasElement>){
  dragRef.current={x:event.clientX,y:event.clientY,rotation:{...rotationRef.current},pointerId:event.pointerId};
  event.currentTarget.setPointerCapture(event.pointerId);setAutoRotate(false);
 }
 function pointerMove(event:PointerEvent<HTMLCanvasElement>){
  const drag=dragRef.current;if(!drag||drag.pointerId!==event.pointerId)return;
  rotationRef.current={x:drag.rotation.x+(event.clientX-drag.x)*.006,y:Math.max(-1.15,Math.min(1.15,drag.rotation.y+(event.clientY-drag.y)*.006))};
 }
 function pointerUp(event:PointerEvent<HTMLCanvasElement>){
  const drag=dragRef.current;if(!drag)return;
  const distance=Math.hypot(event.clientX-drag.x,event.clientY-drag.y);
  dragRef.current=null;
  if(distance<6){
   const rect=event.currentTarget.getBoundingClientRect();const x=event.clientX-rect.left,y=event.clientY-rect.top;
   let nearest:{id:string;distance:number}|null=null;
   for(const [id,point]of positionsRef.current){const distanceToNode=Math.hypot(point.x-x,point.y-y);if(distanceToNode<Math.max(11,point.radius*2.4)&&(!nearest||distanceToNode<nearest.distance))nearest={id,distance:distanceToNode};}
   if(nearest)setSelectedId(nearest.id);
  }
 }
 function pointerCancel(){dragRef.current=null;}
 function onWheel(event:WheelEvent<HTMLCanvasElement>){event.preventDefault();zoomRef.current=Math.max(.65,Math.min(1.65,zoomRef.current*(event.deltaY>0?.92:1.08)));}
 function resetView(){rotationRef.current={x:.16,y:-.08};zoomRef.current=1;setAutoRotate(true);setNotice('Vista reiniciada. La rotación no altera datos del modelo.');}
 function quarantineSelected(){
  if(!selected)return;
  setQuarantined(current=>current.includes(selected.id)?current.filter(id=>id!==selected.id):[...current,selected.id]);
  setNodes(current=>current.map(node=>node.id===selected.id?{...node,status:quarantined.includes(node.id)?'evidence-needed':'quarantined'}:node));
  setNotice(quarantined.includes(selected.id)?'Cuarentena visual retirada. No se ha modificado ningún sistema externo.':'Átomo aislado en esta simulación visual. No es un control de seguridad de producción.');
 }
 function createPod(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  const label=podName.trim();
  if(label.length<3){setNotice('Utiliza un nombre de al menos tres caracteres.');return;}
  const domain=hcuDomains.find(d=>d.id===podDomain)!;
  const node:HcuNode={
   id:`local-pod-${Date.now().toString(36)}`,label,shortLabel:label.toUpperCase().slice(0,30),type:'pod',domainId:podDomain,
   description:'Cognitive Pod añadido por la persona usuaria en la sesión actual. Solo existe en el estado local del navegador.',
   axes:{influence:.4,risk:.35,evidence:0,uncertainty:.8,futurePotential:.65},status:'proposed',
   evidenceStatus:'Sin evidencia asociada. Pendiente de especificación, responsable y pruebas.',
   riskNotes:'No conectado a infraestructura Kubernetes ni a un runtime de IA real.',
   version:'LOCAL-POD-SIMULATION',sources:[],
  };
  setNodes(current=>[...current,node]);setSelectedId(node.id);setPodName('');setShowPodForm(false);
  setNotice(`Pod «${label}» creado localmente en el dominio ${domain.label}. No se desplegó ningún servicio.`);
 }
 function exportSnapshot(){
  setLoadingExport(true);
  const payload={
   schema:'tamv-hcu-snapshot-1.0',canonicalName:'TAMV Ω∞ HCU — Hyperdimensional Cognitive Universe',
   createdAt:new Date().toISOString(),year,viewMode,selectedNode:selectedId,
   disclaimer:'Modelo conceptual demostrativo. Los parámetros, ponderaciones y escenarios son ilustrativos, no evidencia empírica, predicción científica, certificación ni estado real de infraestructura.',
   nodes:nodes.map(node=>({...node,quarantined:quarantined.includes(node.id)})),hyperedges:hcuHyperedges,domains:hcuDomains,
   scenarioWeights,activeFilters:{query,showLabels,autoRotate},
  };
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download='tamv-hcu-snapshot.json';anchor.click();URL.revokeObjectURL(url);
  setLoadingExport(false);setNotice('Snapshot JSON generado desde el navegador. Contiene el modelo conceptual de esta sesión.');
 }
 const domain=nodeDomain(selected?.domainId);
 const phase=selected?((selected.axes.uncertainty*180+year*7)%360):0;
 const quarantinedCount=quarantined.length;
 return <div className="hcu-universe-root">
  <section className="hcu-hero">
   <div className="hcu-hero-copy"><p className="eyebrow"><span className="eyebrow-line"/>TRANSFORMATION INTELLIGENCE / VETRA-ALIGNED</p><h1>TAMV Ω∞ <em>HCU</em></h1><p className="hcu-title">Hyperdimensional Cognitive Universe</p><p className="hcu-lead">Explora cómo se conectan ciencia, tecnología, territorio, economía y gobernanza. HCU añade trazabilidad de hipótesis, riesgo, incertidumbre y decisiones al mapa interactivo.</p><div className="hcu-tags"><span><Orbit/>Grafo 3D interactivo</span><span><GitBranch/>Hyperedges multidireccionales</span><span><ShieldCheck/>VETRA · evidencia primero</span></div></div>
   <aside className="hcu-hero-metadata"><span className="hcu-status-dot"/> <span>MODELO DE DEMOSTRACIÓN</span><strong>25 entidades base</strong><p>6 dominios · 18 átomos · 7 relaciones multidireccionales</p><div className="hcu-rule"/><p className="hcu-warning"><AlertTriangle aria-hidden="true"/> No es un pronóstico validado, un motor cuántico ni un clúster Kubernetes activo. Los parámetros visibles son ilustrativos.</p></aside>
  </section>

  <section className="hcu-dashboard section-wrap">
   <div className="hcu-commandbar">
    <div className="hcu-search-wrap"><Search aria-hidden="true"/><input aria-label="Buscar entidades HCU" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar tema, dominio, riesgo o pregunta…"/>{query&&<button type="button" onClick={()=>setQuery('')} aria-label="Limpiar búsqueda"><X/></button>}
     {matchingNodes.length>0&&<div className="hcu-search-results">{matchingNodes.map(node=><button type="button" key={node.id} onClick={()=>{selectNode(node);setQuery(node.label);}}><span>{node.type==='domain'?'DOMINIO':node.type==='core'?'NÚCLEO':node.type==='pod'?'POD':'ÁTOMO'}</span><strong>{node.label}</strong><small>{node.domainId?domainColor[node.domainId]&&hcuDomains.find(d=>d.id===node.domainId)?.label:'Orquestación conceptual'}</small></button>)}</div>}
    </div>
    <div className="hcu-command-actions"><button type="button" className="hcu-icon-button" onClick={resetView} title="Restablecer vista"><RotateCcw/></button><button type="button" className={'hcu-icon-button '+(autoRotate?'active':'')} onClick={()=>setAutoRotate(value=>!value)} title={autoRotate?'Pausar rotación':'Reanudar rotación'}>{autoRotate?<Pause/>:<Play/>}</button><button type="button" className="hcu-icon-button" onClick={()=>setHelpOpen(value=>!value)} title="Acerca del modelo"><CircleHelp/></button><button type="button" className="hcu-export-button" onClick={exportSnapshot}><ArrowDownToLine/>{loadingExport?'Generando…':'Exportar snapshot'}</button></div>
   </div>
   <div className="hcu-layout">
    <section className="hcu-visual-column" aria-label="Mapa de transformación interactivo">
     <div className="hcu-modebar">
      {([
       ['topology','Topología',Compass],['hyperedges','Hyperedges',Network],['pods','Cognitive Pods',Layers3],['risk','Riesgo sistémico',ShieldAlert],['evidence','Evidencia',FileCheck2],
      ] as const).map(([mode,label,Icon])=><button key={mode} type="button" className={viewMode===mode?'selected':''} onClick={()=>setViewMode(mode)}><Icon aria-hidden="true"/><span>{label}</span></button>)}
     </div>
     <div ref={hostRef} className="hcu-canvas-host">
      <canvas ref={canvasRef} aria-label="Universo HCU. Arrastra para rotar; selecciona una entidad para consultar su ficha." role="img" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerCancel} onWheel={onWheel}/>
      <div className="hcu-canvas-label hcu-canvas-label-top"><span className="hcu-live-pip"/>{viewMode==='hyperedges'?'RELACIONES MULTIDIMENSIONALES':viewMode==='risk'?'MAPA DE RIESGO CONCEPTUAL':viewMode==='evidence'?'PROCEDENCIA Y COBERTURA':viewMode==='pods'?'CAPA DE PODS SIMULADOS':'MAPA SISTÉMICO'} <b>{year}</b></div>
      <div className="hcu-canvas-label hcu-canvas-label-bottom"><span>Ω CORE</span><i/ ><span>{nodes.length} nodos</span><i/ ><span>{hcuHyperedges.length} hyperedges</span><i/ ><span>Zoom {(zoomRef.current*100).toFixed(0)}%</span></div>
      <div className="hcu-axis-legend"><span><i style={{background:'#75d7f0'}}/>IA</span><span><i style={{background:'#d4b77b'}}/>Economía</span><span><i style={{background:'#bba4f6'}}/>Gobernanza</span><span><i style={{background:'#8bd6a8'}}/>Clima</span><span><i style={{background:'#f49dba'}}/>Salud</span><span><i style={{background:'#f4a575'}}/>Seguridad</span></div>
     </div>
     <div className="hcu-view-controls"><label><span>Horizonte temporal</span><strong>{year}</strong><input aria-label="Año del horizonte temporal" type="range" min={2026} max={2050} step={1} value={year} onChange={event=>setYear(Number(event.target.value))}/><small>2026 · presente de referencia <b>2050 · horizonte ilustrativo</b></small></label><label className="hcu-toggle"><input type="checkbox" checked={showLabels} onChange={event=>setShowLabels(event.target.checked)}/><span>Etiquetas en el mapa</span></label></div>
     <div className="hcu-scenario-section"><div className="hcu-section-kicker">FUTUROS DE EXPLORACIÓN <span>· PESOS ILUSTRATIVOS, NO PROBABILIDADES INFERIDAS</span></div><div className="hcu-scenario-grid">{scenarioWeights.map((scenario,index)=><article key={scenario.id} className={'scenario-'+scenario.id.toLowerCase()}><div><span>ESCENARIO {scenario.id}</span><b>{String(scenario.weight).padStart(2,'0')}</b></div><h3>{scenario.label}</h3><div className="hcu-scenario-track"><i style={{width:scenario.weight+'%'}}/></div><p>{scenario.description}</p></article>)}</div></div>
    </section>

    <aside className="hcu-inspector" aria-label="Inspector de entidad seleccionada">
     <div className="hcu-inspector-heading"><span>ENTITY INSPECTOR / 01</span><span className="hcu-state">{selected?.status==='quarantined'?'AISLADO':selected?.status==='evidence-needed'?'EVIDENCIA PENDIENTE':selected?.status==='under-study'?'EN ESTUDIO':'PROPUESTO'}</span></div>
     <div className="hcu-selected-type">{selected?.type==='core'?'NÚCLEO DE ORQUESTACIÓN':selected?.type==='domain'?'DOMINIO TRANSFORMACIONAL':selected?.type==='pod'?'COGNITIVE POD LOCAL':'ÁTOMO COGNITIVO'}</div>
     <h2>{selected?.label||'Selecciona una entidad'}</h2>
     <p className="hcu-selected-desc">{selected?.description}</p>
     <div className="hcu-inspector-divider"/>
     <div className="hcu-axis-title"><span>ESTADO MULTIDIMENSIONAL</span><span>ÍNDICES DE DEMOSTRACIÓN</span></div>
     {selected&&<div className="hcu-axis-bars">{AXES.map(axis=><div className="hcu-axis-row" key={axis.key}><div><span>{axis.short}</span><label>{axis.label}</label><b>{Math.round(selected.axes[axis.key]*100)}</b></div><div className="hcu-axis-track"><i style={{width:(selected.axes[axis.key]*100)+'%',background:selectedColor}}/></div></div>)}</div>}
     <p className="hcu-axis-disclaimer">Los valores son parámetros de una simulación visual. No proceden de sensores, estudios empíricos, evaluación externa o certificación ISCIR/VETRA.</p>
     <div className="hcu-inspector-divider"/>
     <div className="hcu-inspector-info"><span>ESTADO DE LA EVIDENCIA</span><p><FileCheck2 aria-hidden="true"/>{selected?.evidenceStatus||'Pendiente'}</p>{selected?.sources?.length?<ul>{selected.sources.map(source=><li key={source}>{source}</li>)}</ul>:<small>No hay fuentes específicas vinculadas a esta entidad.</small>}</div>
     <div className="hcu-inspector-info"><span>RIESGO Y LIMITACIONES</span><p><ShieldAlert aria-hidden="true"/>{selected?.riskNotes||'Requiere análisis de riesgo por disciplina.'}</p></div>
     <div className="hcu-inspector-info"><span>HYPEREDGES CONECTADOS</span>
      {selected? hcuHyperedges.filter(edge=>edge.nodeIds.includes(selected.id)).map(edge=><button type="button" key={edge.id} className="hcu-edge-item" onClick={()=>setViewMode('hyperedges')}><span>{edge.relation}</span><strong>{edge.label}</strong><small>{edge.nodeIds.length} entidades · evidencia pendiente</small></button>):<small>Selecciona un átomo para ver sus relaciones.</small>}
     </div>
     <div className="hcu-inspector-divider"/>
     <div className="hcu-quantum-simulation"><div><Atom aria-hidden="true"/><span>ESTADO ψ <small>FASE VISUAL</small></span></div><strong>{(phase*Math.PI/180).toFixed(2)} rad</strong><p>Representación animada para navegación. No realiza cálculo cuántico ni mide entrelazamiento físico.</p></div>
     <div className="hcu-inspector-buttons"><button type="button" className="hcu-button-secondary" onClick={quarantineSelected} disabled={!selected||selected.type==='core'}><LockKeyhole aria-hidden="true"/>{quarantined.includes(selected?.id||'')?'Retirar cuarentena':'Aislar en simulación'}</button><button type="button" className="hcu-button-secondary" onClick={()=>{setShowPodForm(value=>!value);setPodDomain(selected?.domainId||'ai');}}><Plus aria-hidden="true"/>Crear Cognitive Pod</button></div>
     {showPodForm&&<form className="hcu-create-pod" onSubmit={createPod}><label><span>Nombre del pod</span><input maxLength={60} value={podName} onChange={event=>setPodName(event.target.value)} required minLength={3} placeholder="Ej. Integridad de datos"/></label><label><span>Dominio principal</span><select value={podDomain} onChange={event=>setPodDomain(event.target.value as HcuDomainId)}>{hcuDomains.map(domain=><option key={domain.id} value={domain.id}>{domain.label}</option>)}</select></label><div><button type="submit" className="hcu-button-primary"><Plus aria-hidden="true"/>Añadir al modelo local</button><button type="button" className="hcu-close-pod" onClick={()=>setShowPodForm(false)}>Cancelar</button></div><small>Se guarda solo en el estado de esta sesión; no se crea un servicio ni un pod Kubernetes real.</small></form>}
     {notice&&<div className="hcu-notice" role="status"><CheckCircle2 aria-hidden="true"/><p>{notice}</p><button type="button" onClick={()=>setNotice('')} aria-label="Cerrar aviso"><X/></button></div>}
    </aside>
   </div>
   <div className="hcu-domain-overview"><div className="hcu-section-kicker">SEIS DOMINIOS / PUNTOS DE ENTRADA</div><div className="hcu-domain-grid">{hcuDomains.map(domain=>{const node=nodes.find(item=>item.id===`domain-${domain.id}`);return <button type="button" key={domain.id} className={selected?.domainId===domain.id?'active':''} onClick={()=>{if(node)selectNode(node);}}><span style={{background:domain.color}}/><div><strong>{domain.label}</strong><small>{domain.subtitle}</small></div><ArrowRight aria-hidden="true"/></button>;})}</div></div>
   <div className="hcu-lower-grid">
    <section className="hcu-lower-panel"><div className="hcu-section-kicker">RUNTIME VIEW / SIMULACIÓN LOCAL</div><div className="hcu-stat-list"><article><Layers3/><span>Átomos base<strong>{hcuAtomsCount}</strong></span></article><article><Activity/><span>Pods creados en esta sesión<strong>{podCount}</strong></span></article><article><ShieldAlert/><span>Entidades aisladas visualmente<strong>{quarantinedCount}</strong></span></article><article><Network/><span>Relaciones multidireccionales<strong>{hcuHyperedges.length}</strong></span></article></div><p>La capa runtime no está conectada a Kubernetes, modelos, memoria persistente ni telemetría de producción. Estos controles operan solo sobre el modelo local de la interfaz.</p></section>
    <section className="hcu-lower-panel"><div className="hcu-section-kicker">FUENTES Y CONECTORES A INTEGRAR</div><p className="hcu-source-intro">Infraestructura pública recomendada para convertir las preguntas del mapa en expedientes trazables. Su inclusión aquí no significa que cada entidad HCU ya consuma esas APIs.</p><div className="hcu-source-list">{hcuSources.map(source=><a key={source.name} href={source.url} target="_blank" rel="noopener noreferrer"><Globe2 aria-hidden="true"/><span><strong>{source.name}</strong><small>{source.purpose}</small></span><ArrowRight aria-hidden="true"/></a>)}</div></section>
   </div>
   {helpOpen&&<div className="hcu-help-overlay" role="dialog" aria-modal="true" aria-label="Metodología del mapa HCU"><div className="hcu-help-card"><button type="button" className="hcu-help-close" onClick={()=>setHelpOpen(false)} aria-label="Cerrar explicación"><X/></button><p className="eyebrow">METODOLOGÍA Y LÍMITES</p><h2>Un mapa de preguntas, no una máquina de verdades.</h2><p>HCU toma como referencia el enfoque del World Economic Forum de interconectar asuntos complejos, pero añade un modelo explícito de estados, relaciones de varios miembros, dimensiones de riesgo e incertidumbre y puertas de evidencia inspiradas en VETRA.</p><p>En esta versión las entidades y los vínculos son una taxonomía inicial de demostración creada para explorar el diseño. No se han validado con un proceso de revisión por pares, no se alimentan en tiempo real de fuentes científicas y no deben usarse para decidir políticas, inversiones, salud, seguridad ni intervención territorial.</p><p>La etapa de investigación posterior debe asignar a cada arista una definición operacional, fuente primaria, método, fecha, responsable, confianza justificada y revisión independiente. Los cambios de escenario no son pronósticos: son controles de exploración narrativa.</p><div className="hcu-help-links">{hcuSources.map(source=><a key={source.name} href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a>)}</div></div></div>}
  </section>
 </div>;
}

function nodeDomain(id:HcuDomainId|null){
 return hcuDomains.find(domain=>domain.id===id)||null;
}
