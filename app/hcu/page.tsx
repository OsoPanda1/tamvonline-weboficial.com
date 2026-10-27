import SiteHeader from '@/app/components/site-header';
import Link from 'next/link';
import { GitBranch, ShieldCheck } from 'lucide-react';
import HcuUniverse from './hcu-universe';

export const dynamic='force-dynamic';
export const metadata={
 title:'TAMV Ω∞ HCU — Hyperdimensional Cognitive Universe',
 description:'Mapa de transformación interactivo para explorar relaciones multidimensionales, evidencia, riesgos y escenarios de investigación de TAMV Online Network.',
 openGraph:{title:'TAMV Ω∞ HCU',description:'Universo cognitivo interactivo: dominios, hyperedges, riesgo, evidencia y escenarios transparentes.',type:'website'},
};

export default async function HcuPage(){
 const session=await currentServerSession();
 return <main className="site-shell hcu-site-shell">
  <div className="utility-strip"><span>TAMV Ω∞ HCU</span><span>TRANSFORMATION INTELLIGENCE / 2026–2050</span><span>ESTADO: PROTOTIPO CONCEPTUAL INTERACTIVO</span></div>
  <SiteHeader active="/hcu" />
  <HcuUniverse />
  <section className="hcu-publication-cta"><div className="section-wrap hcu-publication-cta-inner"><div><p className="eyebrow"><span className="eyebrow-line"/>DEL MAPA A LA INVESTIGACIÓN</p><h2>Una relación visible es una hipótesis. <em>La evidencia la debe sostener.</em></h2><p>Conecta cada pregunta del HCU con fuentes, versiones, métodos y revisiones independientes antes de tratarla como conocimiento institucional.</p></div><div className="hcu-publication-cta-actions"><Link className="button button-primary" href="/vetra"><ShieldCheck aria-hidden="true"/> Marco de evaluación VETRA <ArrowUpRight aria-hidden="true"/></Link><Link className="button button-ghost" href="/investigacion"><GitBranch aria-hidden="true"/> Explorar investigación <ArrowUpRight aria-hidden="true"/></Link></div></div></section>
  <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>TAMV Ω∞ HCU · Modelo interactivo conceptual · v1.0</span><Link href="/vetra">VETRA Ω∞</Link><Link href="/roadmap">Roadmap institucional</Link><Link href="/politica-editorial">Política editorial</Link><Link href="/privacidad">Privacidad</Link></div></div></footer>
 </main>;
}
