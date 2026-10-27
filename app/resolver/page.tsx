'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Fingerprint, Search } from 'lucide-react';

export default function ResolverPage() {
  const [value,setValue]=useState('');
  const [error,setError]=useState('');
  function resolve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id=value.trim().toUpperCase();
    if(!/^TAMV-[0-9A-F]{26}$/.test(id)) { setError('El formato esperado es TAMV- seguido de 26 caracteres hexadecimales.'); return; }
    window.location.assign('/miembro/'+encodeURIComponent(id));
  }
  return <main><div className="utility-strip"><span>TAMV ID RESOLVER</span><span>IDENTIFICADOR PERSISTENTE INTERNO</span></div><header className="site-header"><Link className="brand-lockup" href="/"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link><nav className="site-nav"><Link href="/membresia">Membresía</Link><Link href="/registro">Registro</Link><Link href="/catalogo">Catálogo</Link></nav></header><section className="form-shell"><div className="form-layout"><aside className="form-intro"><Fingerprint aria-hidden="true"/><h1>Resolver una identidad TAMV.</h1><p>Introduce el identificador para consultar una ficha que esté aprobada y publicada. Los perfiles privados, pendientes o retirados no muestran datos personales.</p><div className="role-note">TAMV ID es propio de la plataforma; no sustituye ORCID, ISNI, DOI u otros identificadores independientes.</div></aside><form className="form-panel" onSubmit={resolve}><h2>Buscar TAMV ID</h2><p className="subtext">La búsqueda no revela si existe un registro privado o pendiente de revisión.</p><div className="field"><label htmlFor="tamvId">Identificador</label><input id="tamvId" value={value} onChange={e=>setValue(e.target.value.toUpperCase())} required maxLength={31} placeholder="TAMV-0123456789ABCDEF0123456789" autoComplete="off"/></div>{error&&<div className="form-alert error" role="alert">{error}</div>}<div className="form-actions"><button type="submit" className="button button-primary">Resolver <Search aria-hidden="true"/></button><Link className="button button-ghost" href="/registro">Obtener un TAMV ID <ArrowRight aria-hidden="true"/></Link></div></form></div></section></main>;
}
