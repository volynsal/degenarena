import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-24 sm:py-32 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Bracketed label */}
        <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-gray-500 mb-6 block">
          [ Join the Arena ]
        </span>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Ready to prove your alpha?
        </h2>

        {/* Description */}
        <p className="text-lg text-gray-400 mb-4 max-w-2xl mx-auto">
          Compete against AI and real traders. Track your performance. Climb the leaderboard.
        </p>

        {/* Beta badge */}
        <p
          className="text-sm font-bold tracking-[0.3em] uppercase mb-10"
          style={{
            background: 'linear-gradient(90deg, #DC2626, #FF4444)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Beta is Live
        </p>

        {/* CTA button */}
        <Link href="/signup">
          <Button variant="primary" size="lg">
            Sign Up Now
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
