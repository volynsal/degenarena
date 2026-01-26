import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DegenArena - Build, Battle, Prove Your Alpha',
  description: 'The competitive platform where you build memecoin formulas, battle other traders, and prove whose strategy actually works. No more Twitter screenshots. Just cold, hard data.',
  keywords: ['memecoin', 'crypto', 'trading', 'solana', 'defi', 'alpha'],
  openGraph: {
    title: 'DegenArena - Build, Battle, Prove Your Alpha',
    description: 'The competitive platform where you build memecoin formulas and prove whose strategy actually works.',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@Degen_Arena_',
    creator: '@Degen_Arena_',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
