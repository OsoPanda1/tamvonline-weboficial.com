import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, ChevronDown, CircleUserRound, LogIn, UserPlus } from 'lucide-react';
import { currentServerSession } from '@/lib/auth0-native';

type Props={active?:string};

const groups=[
 {label:'Investigación',key:'research',items:[
  {href:'/investigacion',label:'Producción y registros'},
  {href:'/catalogo',label:'Catálogo de conocimiento'},
  {href:'/auditoria',label:'Auditoría de evidencia e IP'},
  {href:'/vetra',label:'VETRA Ω∞ · Evaluación'},
 ]},
 {label:'Comunidad',key:'community',items:[
  {href:'/miembros',label:'Directorio de investigadores y desarrolladores'},
  {href:'/membresia',label:'Membresías y participación'},
  {href:'/contribuir',label:'Cómo contribuir'},
  {href:'/roadmap',label:'Roadmap institucional'},
 ]},
 {label:'Plataforma',key:'platform',items:[
  {href:'/hcu',label:'HCU Ω∞ · Mapa de transformación'},
  {href:'/resolver',label:'Resolver TAMV ID'},
  {href:'/recursos',label:'Centro de recursos'},
 ]},
 {label:'Gobernanza',key:'governance',items:[
  {href:'/politica-editorial',label:'Política editorial'},
  {href:'/privacidad',label:'Privacidad'},
  {href:'/terminos',label:'Términos de participación'},
 ]},
];

export default async function SiteHeader({active}:Props){
 const session=await currentServerSession();
 return <header className="site-header site-header-unified">
  <Link className="brand-lockup" href="/" aria-label="TAMV Online Network, inicio"><span className="brand-monogram">T</span><span className="brand-wording"><strong>TAMV</strong><small>ONLINE NETWORK</small></span></Link>
  <nav className="site-nav site-nav-unified" aria-label="Navegación principal">
   <Link href="/" aria-current={active==='home'?'page':undefined}>Institución</Link>
   {groups.map(group=><details key={group.key} className="site-nav-group">
    <summary aria-label={group.label+' — abrir menú'}>{group.label}<ChevronDown aria-hidden="true"/></summary>
    <div className="site-nav-menu" role="group" aria-label={group.label}>
     {group.items.map(item=><Link key={item.href} href={item.href} aria-current={active===item.href?'page':undefined}>{item.label}<ArrowDownRight aria-hidden="true"/></Link>)}
    </div>
   </details>)}
  </nav>
  <div className="header-actions site-header-auth">
   {session ? <>
    <Link className="button button-small button-ghost" href="/cuenta"><CircleUserRound aria-hidden="true"/> Mi cuenta</Link>
    <a className="header-login" href="/api/auth/logout">Salir</a>
   </> : <>
    <Link className="header-login" href="/cuenta"><LogIn aria-hidden="true"/> Acceder</Link>
    <Link className="button button-small button-primary" href="/registro"><UserPlus aria-hidden="true"/> Crear perfil <ArrowUpRight aria-hidden="true"/></Link>
   </>}
  </div>
 </header>;
}
