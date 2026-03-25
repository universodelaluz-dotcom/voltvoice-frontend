import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VoltVoice - Usa voces clonadas de tus personajes favoritos en tus streams',
  description: 'La solución completa para streamers de TikTok. Clona voces de personajes, integración en vivo y monetiza mientras streameas.',
  keywords: 'TikTok, streaming, voces clonadas, clonación de voz, AI, personalización',
  authors: [{ name: 'VoltVoice Team' }],
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://voltvoice.app',
    title: 'VoltVoice - Voces Clonadas para TikTok',
    description: 'La solución completa para streamers de TikTok. Clona voces de personajes, integración en vivo y monetiza.',
    images: [
      {
        url: 'https://voltvoice.app/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VoltVoice - Voces Clonadas para TikTok',
    description: 'La solución completa para streamers de TikTok',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-voltvoice-dark text-white antialiased">
        {children}
      </body>
    </html>
  )
}
