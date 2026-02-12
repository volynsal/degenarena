import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })
const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-brand',
  weight: ['400', '500', '600', '700', '800', '900']
})

export const metadata: Metadata = {
  metadataBase: new URL('https://degenarena-azure.vercel.app'),
  title: 'DegenArena HQ - Build, Battle, Prove Your Alpha',
  description: 'The competitive platform where you build memecoin formulas, battle other traders, and prove whose strategy actually works. No more Twitter screenshots. Just cold, hard data.',
  keywords: ['memecoin', 'crypto', 'trading', 'solana', 'defi', 'alpha'],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DegenArena HQ',
  },
  openGraph: {
    title: 'DegenArena HQ - Build, Battle, Prove Your Alpha',
    description: 'The competitive platform where you build memecoin formulas and prove whose strategy actually works.',
    siteName: 'DegenArena HQ',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@degenarenahq',
    creator: '@degenarenahq',
    title: 'DegenArena HQ - Build, Battle, Prove Your Alpha',
    description: 'The competitive platform where you build memecoin formulas and prove whose strategy actually works.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${orbitron.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
