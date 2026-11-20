import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import SiteHeader from '@/app/components/site-header'
import IsabellaChat from './isabella-chat'

export const metadata: Metadata = {
  title: 'Isabella Villaseñor AI',
  description: 'Conversa con Isabella sobre investigación, tecnología y memoria territorial. Asistente experimental con límites de capacidad explícitos.',
  alternates: { canonical: '/isabella' },
}

export default function IsabellaPage() {
  return (
    <main className="site-shell">
      <div className="utility-strip"><span>ASISTENTE EXPERIMENTAL</span><span>TAMV ONLINE NETWORK · HIDALGO, MÉXICO</span><span>IA RESPONSABLE · SUPERVISIÓN HUMANA</span></div>
      <SiteHeader active="/isabella" />
      <section className="isabella-hero section-wrap">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" />ASISTENTE DE TEXTO · CAPA PÚBLICA</p>
          <h1>Isabella <em>Villaseñor AI</em></h1>
          <p>Un espacio de conversación para explorar preguntas de investigación, tecnología y memoria territorial dentro de TAMV Online Network.</p>
        </div>
        <Link className="isabella-source-link" href="https://github.com/AnubisVillasenor1/ISABELLA-VERSION-TERMINUS-V6" target="_blank" rel="noopener noreferrer">Repositorio de Isabella <ArrowUpRight aria-hidden="true" /></Link>
      </section>
      <IsabellaChat />
      <footer className="site-footer"><div className="section-wrap"><div className="footer-bottom"><span>ISABELLA · Capa experimental de TAMV</span><Link href="/privacidad">Privacidad</Link><Link href="/politica-editorial">Política editorial</Link><Link href="/">TAMV Online Network</Link></div></div></footer>
    </main>
  )
}
