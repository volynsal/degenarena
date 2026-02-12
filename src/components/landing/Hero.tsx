import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'
import { FlowField } from './FlowField'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Tron-style grid background */}
      <FlowField />
      
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern" style={{ zIndex: 1 }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-arena-purple/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-arena-cyan/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
      
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Stylized badge */}
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm mb-10">
          <span className="text-lg">🎮</span>
          <span className="text-sm sm:text-base font-bold tracking-[0.25em] uppercase text-gray-300 font-brand">
            Esports for Degens
          </span>
          <span className="text-lg">🏆</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[0.95]">
          <span className="text-white">Build. Compete.</span>
          <br />
          <span className="gradient-text">Prove Your Alpha.</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-10">
        Compete against AI bots and real traders. Enter weekly competitions and clan battles. Participate in prediction markets for vetted shitcoins.
        <br />
        <br />
        The best traders don't just make money—they prove it.
        </p>
        
        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link href="/signup">
            <Button variant="primary" size="lg">
              Enter the Arena
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <p
            className="text-sm font-bold tracking-[0.3em] uppercase"
            style={{
              background: 'linear-gradient(90deg, #DC2626, #FF4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Beta is Live
          </p>
        </div>
      </div>
    </section>
  )
}
