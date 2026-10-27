'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, CircleUserRound, Filter, Globe2, Search, ShieldCheck, X } from 'lucide-react';
import type { PublicMemberProfile } from '@/lib/supabase-rest';

function labelScheme(scheme: string): string {
  if (scheme === 'ORCID') return 'ORCID verificado';
  if (scheme === 'GITHUB') return 'GitHub vinculado';
  if (scheme === 'ISNI') return 'ISNI verificado';
  return 'Web verificada';
}
function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null;
  } catch { return null; }
}

export default function MemberDirectory({profiles}:{profiles:PublicMemberProfile[]}) {
  const [query,setQuery]=useState('');
  const [country,setCountry]=useState('all');
  const [area,setArea]=useState('all');
  const countries=useMemo(()=>Array.from(new Set(profiles.map(p=>p.country_code).filter((x):x is string=>Boolean(x)))).sort(),[profiles]);
  const areas=useMemo(()=>Array.from(new Set(profiles.flatMap(p=>p.research_areas||[]))).sort((a,b)=>a.localeCompare(b,'es')),[profiles]);
  const filtered=useMemo(()=>{
    const term=query.trim().toLocaleLowerCase('es-MX');
    return profiles.filter(profile=>{
      const text=[profile.display_name,profile.affiliation||'',profile.bio||'',profile.country_code||'',...(profile.research_areas||[]),...(profile.identifiers||[]).map(identifier=>identifier.value)].join(' ').toLocaleLowerCase('es-MX');
      return (!term||text.includes(term))&&(country==='all'||profile.country_code===country)&&(area==='all'||profile.research_areas.includes(area));
    });
  },[profiles,query,country,area]);
  function clearFilters(){setQuery('');setCountry('all');setArea('all');}
  return <div className="member-directory">
    <div className="member-directory-search">
      <label className="member-search-input"><Search aria-hidden="true"/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar por nombre, afiliación, área o identificador…" aria-label="Buscar perfiles públicos"/></label>
      <div className="member-filter-field"><label htmlFor="member-country">País</label><select id="member-country" value={country} onChange={event=>setCountry(event.target.value)}><option value="all">Todos</option>{countries.map(value=><option key={value} value={value}>{value}</option>)}</select></div>
      <div className="member-filter-field"><label htmlFor="member-area">Área de trabajo</label><select id="member-area" value={area} onChange={event=>setArea(event.target.value)}><option value="all">Todas las áreas</option>{areas.map(value=><option key={value} value={value}>{value}</option>)}</select></div>
      <button className="member-clear-filters" type="button" onClick={clearFilters}><X aria-hidden="true"/> Limpiar</button>
    </div>
    <div className="member-directory-summary"><span><Filter aria-hidden="true"/>{filtered.length} perfiles públicos</span><small>Solo miembros aprobados con consentimiento expreso de publicación.</small></div>
    {filtered.length===0 ? <div className="member-directory-empty"><CircleUserRound aria-hidden="true"/><h2>{profiles.length===0?'Aún no hay perfiles públicos publicados':'No hay resultados con estos filtros'}</h2><p>{profiles.length===0?'Este directorio no inventa integrantes ni convierte el registro en una acreditación. Los perfiles aparecerán cuando haya miembros reales que hayan solicitado y obtenido aprobación para su publicación.':'Prueba otro término de búsqueda o limpia los filtros.'}</p>{profiles.length===0?<Link className="button button-primary" href="/registro">Crear cuenta TAMV ID <ArrowRight aria-hidden="true"/></Link>:<button className="button button-ghost" type="button" onClick={clearFilters}>Limpiar filtros</button>}</div>:
    <div className="member-directory-grid">{filtered.map(profile=><article className="member-profile-card" key={profile.tamv_id}>
      <div className="member-profile-card-top"><span className="member-id-chip">{profile.tamv_id}</span><span className="member-public-status"><ShieldCheck aria-hidden="true"/> Público consentido</span></div>
      <div className="member-profile-main"><div className="member-avatar" aria-hidden="true">{profile.display_name.trim().slice(0,1).toLocaleUpperCase('es-MX')||'T'}</div><div><h2>{profile.display_name}</h2><p>{profile.affiliation||'Afiliación no declarada'}{profile.country_code?' · '+profile.country_code:''}</p></div></div>
      {profile.bio&&<p className="member-profile-bio">{profile.bio}</p>}
      {profile.research_areas?.length>0&&<div className="member-profile-areas">{profile.research_areas.slice(0,6).map(item=><span key={item}>{item}</span>)}</div>}
      {profile.identifiers?.length>0&&<div className="member-profile-identifiers">{profile.identifiers.map(identifier=>{const url=safeExternalUrl(identifier.value);return url?<a key={identifier.scheme+url} href={url} target="_blank" rel="noopener noreferrer"><Globe2 aria-hidden="true"/>{labelScheme(identifier.scheme)} <ArrowUpRight aria-hidden="true"/></a>:null;})}</div>}
      <div className="member-profile-footer"><Link href={'/miembro/'+encodeURIComponent(profile.tamv_id)}>Ver perfil público <ArrowRight aria-hidden="true"/></Link><span>Actualizado {new Date(profile.updated_at).toLocaleDateString('es-MX')}</span></div>
    </article>)}</div>}
    <p className="member-directory-note">La inclusión en este directorio acredita que un perfil público ha sido aprobado según la política de TAMV; no acredita por sí sola grados, afiliaciones, calidad científica ni competencia profesional.</p>
  </div>;
}
