import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TAMV Online Network | Investigación aplicada y ciencia abierta',
  description: 'Organización independiente de investigación aplicada, desarrollo tecnológico y ciencia abierta desde Real del Monte, Hidalgo, México.',
  keywords: ['TAMV Online Network', 'investigación aplicada', 'ciencia abierta', 'inteligencia artificial', 'Real del Monte'],
  authors: [{ name: 'TAMV Online Network' }],
  openGraph: {
    title: 'TAMV Online Network',
    description: 'Investigación aplicada, infraestructura digital y ciencia abierta desde México.',
    type: 'website',
  },
  generator: 'TAMV Online Network',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#16283b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
