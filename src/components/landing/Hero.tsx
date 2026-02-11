import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, ShieldCheck, Trophy, Activity } from 'lucide-react'
import { VideoBackground } from './FlowField'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Animated Flow Field Background */}
      <VideoBackground />
      
      {/* Background effects - subtle glows behind flow field */}
      <div className="absolute inset-0 grid-pattern" style={{ zIndex: 1 }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-arena-purple/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-arena-cyan/10 rounded-full blur-[128px]" style={{ zIndex: 1 }} />
      
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
          <span className="text-sm text-gray-300">🎮 ESPORTS FOR DEGENS 🏆</span>
        </div>
        
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="text-white">Build. Compete.</span>
          <br />
          <span className="gradient-text">Prove your alpha.</span>
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-4">
          Compete against AI bots and real traders. Enter weekly competitions and clan battles. Participate in prediction markets for vetted <em className="line-through italic">shit</em>coins.
        </p>
        <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto mb-10">
          The best traders don&apos;t just make money—they prove it.
        </p>
        
        {/* BETA IS LIVE */}
        <p
          className="text-2xl sm:text-3xl font-bold tracking-widest mb-6"
          style={{
            background: 'linear-gradient(90deg, #DC2626, #FF4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          BETA IS LIVE
        </p>
        
        {/* Sign Up CTA */}
        <Link href="/signup">
          <Button variant="primary" size="lg">
            Sign Up Now
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
        
        {/* Preview image/mockup */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-arena-darker via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass-card rounded-2xl p-6 sm:p-8 neon-glow mx-auto max-w-5xl text-left">
            <p className="text-xs sm:text-sm tracking-[0.28em] uppercase text-gray-400 mb-6">
              Real-Time Snapshot
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <ShieldCheck className="w-7 h-7 text-arena-cyan mb-5" strokeWidth={1.8} />
                <p className="text-4xl sm:text-5xl leading-none text-white mb-4">—</p>
                <p className="text-gray-400 text-lg sm:text-xl">Verified Profiles</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <Trophy className="w-7 h-7 text-arena-pink mb-5" strokeWidth={1.8} />
                <p className="text-4xl sm:text-5xl leading-none text-white mb-4">—</p>
                <p className="text-gray-400 text-lg sm:text-xl">Competitions Run</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
                <Activity className="w-7 h-7 text-arena-purple mb-5" strokeWidth={1.8} />
                <p className="text-4xl sm:text-5xl leading-none text-white mb-4">—</p>
                <p className="text-gray-400 text-lg sm:text-xl">Signals Triggered</p>
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-arena-purple/35 bg-gradient-to-r from-arena-purple/15 via-arena-blue/10 to-arena-cyan/15 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-2xl sm:text-3xl text-gray-200">Weekly League</p>
                <span className="text-3xl sm:text-4xl text-arena-cyan">Live</span>
              </div>
              <div className="h-4 rounded-full bg-white/10 overflow-hidden mb-4">
                <div className="h-full w-1/2 bg-gradient-to-r from-arena-purple via-arena-blue to-arena-cyan rounded-full" />
              </div>
              <div className="flex items-center justify-between text-2xl sm:text-4xl text-gray-400">
                <span>— traders active</span>
                <span>— left</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
