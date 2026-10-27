'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Fingerprint, Globe2, Search, Users, X } from 'lucide-react';
import type { PublicMemberProfile } from '@/lib/supabase-rest';

function externalLink(identifier:PublicMemberProfile['identifiers'][number]):string|null{
 if(identifier.scheme==='ORCID'&&/^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(identifier.value))return identifier.value;
 if(identifier.scheme==='GITHUB'&&/^https:\/\/github\.com\/[A-Za-z0-9-]+\/?$/.test(identifier.value))return identifier.value;
 if(identifier.scheme==='WEBSITE'&&identifier.value.startsWith('https://'))return identifier.value;
 if(identifier.scheme==='ISNI')return 'https://isni.org/isni/'+identifier.value.replace(/\s/g,'');
 return null;
}

export default function CommunityDirectory({profiles,loadError=false}:{profiles:PublicMemberProfile[];loadError?:boolean}){
 const [query,setQuery]=useState('');
 const [area,setArea]=useState('all');
 const [country,setCountry]=useState('all');
 const areas=useMemo(()=>[...new Set(profiles.flatMap(profile=>profile.research_areas))].sort((a,b)=>a.localeCompare(b,'es-MX')),[profiles]);
 const countries=useMemo(()=>[...new Set(profiles.map(profile=>profile.country_code).filter((value):value is string=>Boolean(value)))].sort(),[profiles]);
 const visible=useMemo(()=>{
  const term=query.trim().toLocaleLowerCase('es-MX');
  return profiles.filter(profile=>{
   const haystack=[profile.display_name,profile.bio||'',profile.affiliation||'',profile.country_code||'',...profile.research_areas].join(' ').toLocaleLowerCase('es-MX');
   return (!term||haystack.includes(term))&&(area==='all'||profile.research_areas.includes(area))&&(country==='all'||profile.country_code===country);
  });
 },[profiles,query,area,country]);

 return <div className="community-directory">
  <div className="community-directory-tools">
   <label className="community-search"><Search aria-hidden="true"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar por nombre, institución o área" aria-label="Buscar perfiles públicos"/></label>
   <label><span>Área de trabajo</span><select value={area} onChange={event=>setArea(event.target.value)}><option value="all">Todas las áreas</option>{areas.map(item=><option key={item} value={item}>{item}</option>)}</select></label>
   <label><span>País</span><select value={country} onChange={event=>setCountry(event.target.value)}><option value="all">Todos los países</option>{countries.map(item=><option key={item} value={item}>{item}</option>)}</select></label>
   {(query||area!=='all'||country!=='all')&&<button type="button" className="community-clear" onClick={()=>{setQuery('');setArea('all');setCountry('all');}}><X aria-hidden="true"/> Limpiar filtros</button>}
  </div>
  <div className="community-directory-summary"><span><Users aria-hidden="true"/> {visible.length} perfiles públicos encontrados</span><small>Solo se incluyen fichas aprobadas con consentimiento expreso. Los perfiles privados, pendientes o retirados no aparecen.</small></div>
  {loadError ? <div className="community-empty"><Globe2 aria-hidden="true"/><h2>El directorio no está disponible temporalmente</h2><p>No se pudo consultar el registro de miembros. No se muestran datos de demostración como si fueran personas reales.</p></div>
   : visible.length===0 ? <div className="community-empty"><Users aria-hidden="true"/><h2>{profiles.length===0?'La comunidad pública está por comenzar':'No hay perfiles con esos filtros'}</h2><p>{profiles.length===0?'Este directorio se llena con perfiles reales que hayan sido aprobados y publicados con consentimiento. No se generan biografías ficticias para rellenar la página.':'Prueba otro término, área o país; los filtros solo afectan los perfiles públicos disponibles.'}</p><Link className="button button-primary" href="/registro">Crear TAMV ID <ArrowUpRight aria-hidden="true"/></Link></div>
   : <div className="community-profile-grid">{visible.map(profile=>{
      const orcid=profile.identifiers.find(item=>item.scheme==='ORCID'&&item.verification_status==='verified');
      const github=profile.identifiers.find(item=>item.scheme==='GITHUB'&&item.verification_status==='verified');
      const website=profile.identifiers.find(item=>item.scheme==='WEBSITE'&&item.verification_status==='verified');
      const isni=profile.identifiers.find(item=>item.scheme==='ISNI'&&item.verification_status==='verified');
      return <article className="community-profile-card" key={profile.tamv_id}>
       <div className="community-profile-top"><span className="community-avatar">{profile.display_name.trim().slice(0,1).toLocaleUpperCase('es-MX')}</span><span className="community-profile-status"><CheckCircle2 aria-hidden="true"/> PERFIL APROBADO</span></div>
       <h2>{profile.display_name}</h2>
       <p className="community-affiliation">{profile.affiliation||'Afiliación no declarada'}{profile.affiliation&&<small> · Declarada por la persona</small>}</p>
       {profile.country_code&&<p className="community-country"><Globe2 aria-hidden="true"/> {profile.country_code}</p>}
       <p className="community-bio">{profile.bio||'Sin biografía pública.'}</p>
       <div className="community-area-list">{profile.research_areas.map(item=><span key={item}>{item}</span>)}</div>
       <div className="community-verified-links">
        {orcid&&<a href={externalLink(orcid)||undefined} target="_blank" rel="noopener noreferrer"><Fingerprint aria-hidden="true"/> ORCID verificado <ArrowUpRight aria-hidden="true"/></a>}
        {github&&<a href={externalLink(github)||undefined} target="_blank" rel="noopener noreferrer">GitHub verificado <ArrowUpRight aria-hidden="true"/></a>}
        {isni&&<a href={externalLink(isni)||undefined} target="_blank" rel="noopener noreferrer">ISNI verificado <ArrowUpRight aria-hidden="true"/></a>}
        {website&&<a href={externalLink(website)||undefined} target="_blank" rel="noopener noreferrer">Sitio verificado <ArrowUpRight aria-hidden="true"/></a>}
       </div>
       <div className="community-profile-bottom"><code>{profile.tamv_id}</code><Link href={'/miembro/'+encodeURIComponent(profile.tamv_id)}>Ver perfil <ArrowUpRight aria-hidden="true"/></Link></div>
      </article>;
    })}</div>}
  <p className="community-directory-footnote">Un perfil TAMV demuestra que existe una ficha dentro de esta plataforma. No acredita por sí mismo empleo, grado académico, afiliación institucional, competencia, autoría científica ni aceptación por una universidad.</p>
 </div>;
}
