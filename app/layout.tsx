import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { VigiaNavbar } from '@/components/vigia-navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'VIGÍA — Visión Inteligente para la Gestión y Vigilancia Animal',
  description:
    'Plataforma de monitoreo ganadero con detección de animales en tiempo real a partir de fuentes de video y drones.',
  generator: 'v0.app',
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
  colorScheme: 'dark',
  themeColor: '#0e1712',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-svh w-full flex-col">
          <VigiaNavbar />
          <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
