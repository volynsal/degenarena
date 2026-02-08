import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-24 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-arena-purple/5 to-transparent" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card rounded-2xl p-8 sm:p-12 text-center neon-glow">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to enter the arena?
          </h2>
          <p className="text-lg text-gray-400 mb-4 max-w-2xl mx-auto">
            Compete against AI and real traders. Track your performance. Climb the leaderboard.
          </p>
          <p className="text-sm font-bold tracking-widest mb-8 bg-gradient-to-r from-arena-cyan via-arena-purple to-arena-cyan bg-clip-text text-transparent">
            BETA IS LIVE
          </p>
          
          <Link href="/signup">
            <Button variant="primary" size="lg">
              Sign Up Now
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
