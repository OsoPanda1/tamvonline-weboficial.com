import type { Metadata } from 'next'
import SiteHeader from '@/app/components/site-header'
import MetaHub from './meta-hub'

export const metadata: Metadata = {
  title: 'TAMV Meta · Lounge de conocimiento',
  description: 'Un espacio de investigación y colaboración para descubrir publicaciones, datos, proyectos y comunidades abiertas con TAMV Online Network.',
  alternates: { canonical: '/meta' },
}

export default function MetaPage() {
  return <main className="site-shell meta-site-shell">
    <div className="utility-strip"><span>INVESTIGACIÓN ABIERTA · COMUNIDAD · TECNOLOGÍA</span><span>TAMV ONLINE NETWORK · META</span><span>HIDALGO · MÉXICO</span></div>
    <SiteHeader active="/meta" />
    <MetaHub />
    <footer className="site-footer meta-footer"><div className="section-wrap"><div className="footer-bottom"><span>© {new Date().getFullYear()} TAMV Online Network · Meta</span><span>Metadatos públicos; confirma cada registro en su fuente original.</span><a href="/politica-editorial">Criterios editoriales</a></div></div></footer>
  </main>
}
