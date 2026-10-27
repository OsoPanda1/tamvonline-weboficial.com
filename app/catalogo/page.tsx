import SiteHeader from '@/app/components/site-header';
import Link from 'next/link';
import catalog from '@/data/catalogo.json';
import CatalogList, { type CatalogRecord } from './catalog-list';

export const metadata = { title: 'Catálogo público', description: 'Catálogo buscable de repositorios, identificadores y publicaciones enlazadas a TAMV Online Network.' };

export default function CatalogPage() {
  const records = catalog.records as CatalogRecord[];
  return <main>
    <div className="utility-strip"><span>CATÁLOGO DOCUMENTAL</span><span>FUENTES · PROCEDENCIA · ESTADO DE REVISIÓN</span></div>
    <SiteHeader active="/catalogo" />
    <section className="legal-page"><div className="legal-container catalog-page-intro"><p className="legal-kicker">PRODUCCIÓN PÚBLICA · REGISTROS PERSISTENTES</p><h1>Un índice consultable con límites de evidencia explícitos.</h1><p>El catálogo enlaza fuentes primarias y registros públicos asociados al proyecto y al fundador. No es una bibliografía exhaustiva ni una evaluación científica. Cada registro debe cotejarse antes de utilizarlo en una cita formal, presentación institucional o solicitud de identificador de organización.</p><div className="legal-notice"><strong>Regla de interpretación:</strong> un DOI, perfil o repositorio demuestra que existe un registro consultable; no prueba por sí solo revisión por pares, validez experimental, afiliación, impacto, certificación ni funcionamiento en producción.</div></div></section>
    <section className="section-wrap catalog-main"><CatalogList records={records}/></section>
    <section className="section-wrap catalog-metadata"><h2>Metadatos recomendados</h2><p>Para cada recurso se debe conservar título original, autores, fecha de publicación, versión, tipo de material, URL persistente, licencia confirmada, idioma, afiliación declarada en el original, alcance, estado de revisión y fecha de comprobación editorial.</p><div className="form-actions"><a className="button button-ghost" href="https://github.com/OsoPanda1/tamvonline-weboficial.com/blob/main/data/catalogo.json" target="_blank" rel="noopener noreferrer">Descargar datos JSON</a><Link className="button button-ghost" href="/politica-editorial">Ver política editorial</Link><a className="button button-ghost" href="https://ror.org/search" target="_blank" rel="noopener noreferrer">Buscar en ROR ↗</a></div></section>
    <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>© {new Date().getFullYear()} TAMV Online Network</span><span>Catalogación sujeta a cotejo de fuentes.</span><Link href="/privacidad">Privacidad</Link></div></div></footer>
  </main>;
}
