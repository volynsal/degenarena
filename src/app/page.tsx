import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { LeaderboardPreview } from '@/components/landing/LeaderboardPreview'
import { CTA } from '@/components/landing/CTA'
import { Footer } from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-arena-darker">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <LeaderboardPreview />
      <CTA />
      <Footer />
    </main>
  )
}
