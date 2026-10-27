import type { Metadata, Viewport } from 'next'
import './globals.css'

const siteUrl = process.env.TAMV_SITE_URL || 'https://tamv.online'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'TAMV Online Network — Conocimiento que perdura',
    template: '%s | TAMV Online Network',
  },
  description: 'Iniciativa mexicana independiente para conectar investigación, desarrollo tecnológico, memoria territorial y colaboración abierta.',
  applicationName: 'TAMV Online Network',
  keywords: ['TAMV Online Network', 'TAMV ID', 'investigación aplicada', 'software abierto', 'inteligencia artificial responsable', 'memoria territorial', 'ciencia abierta'],
  authors: [{ name: 'TAMV Online Network' }, { name: 'Edwin Oswaldo Castillo Trejo', url: 'https://orcid.org/0009-0008-5050-1539' }],
  creator: 'TAMV Online Network',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'TAMV Online Network',
    title: 'TAMV Online Network — Conocimiento que perdura',
    description: 'Investigación, tecnología, memoria territorial y colaboración desde México.',
    url: '/',
    images: [{ url: '/tamv-social-card.svg', width: 1200, height: 630, alt: 'TAMV Online Network — Conocimiento que perdura' }],
    locale: 'es_MX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TAMV Online Network — Conocimiento que perdura',
    description: 'Investigación, tecnología, memoria territorial y colaboración desde México.',
    images: ['/tamv-social-card.svg'],
  },
  icons: { icon: '/tamv-mark.svg', shortcut: '/tamv-mark.svg', apple: '/apple-icon.png' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#05080d',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  )
}
