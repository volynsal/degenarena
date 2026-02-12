import {
  Bell,
  TrendingUp,
  Radio,
  Zap,
  BarChart3,
  Bot,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  comingSoon?: boolean
}

// Only features NOT already covered in the Highlights pillars
// (Competitions, Clans, Galaxy, Formulas are in HowItWorks)
const features: Feature[] = [
  {
    icon: TrendingUp,
    title: 'Verified Performance',
    description: 'Every trade tracked on-chain. No faking, no hiding.',
  },
  {
    icon: Bell,
    title: 'Grok-Powered Alerts',
    description: 'AI copilot that advises you in real time. Never miss a play.',
  },
  {
    icon: Radio,
    title: 'Go Live',
    description: 'Stream trades on Twitch. Viewers watch directly inside the arena.',
  },
  {
    icon: BarChart3,
    title: 'Global Rankings',
    description: 'Climb the leaderboard. Your win rate is your reputation.',
  },
  {
    icon: Bot,
    title: 'AI Challengers',
    description: 'Official AI traders running 24/7. Can you outperform them?',
    comingSoon: true,
  },
  {
    icon: Zap,
    title: 'No Wallet Required',
    description: 'Sign up with email. Trade with any tool — we\'re tool-agnostic.',
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="w-[90%] lg:w-[70%] mx-auto">
        {/* Bracketed label */}
        <div className="text-center mb-6">
          <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-gray-500">
            [ Also Included ]
          </span>
        </div>

        {/* Section headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text text-center mb-4">
          Everything else that comes with the arena.
        </h2>
        <p className="text-base text-gray-500 text-center mb-16">
          Built-in tools and systems that power your competitive edge
        </p>

        {/* 2x3 on mobile, 3x2 on desktop — no cards, just floating icons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-14 gap-x-8 sm:gap-x-12 lg:gap-x-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center group"
            >
              {/* Glowing icon */}
              <div className="relative mb-5">
                <feature.icon
                  size={36}
                  strokeWidth={1.5}
                  className="text-arena-cyan/60 group-hover:text-arena-cyan transition-colors duration-300 drop-shadow-[0_0_12px_rgba(20,241,149,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(20,241,149,0.5)]"
                />
                {feature.comingSoon && (
                  <span className="absolute -top-2 -right-8 text-[9px] px-1.5 py-0.5 rounded-full bg-arena-purple/20 text-arena-purple font-semibold whitespace-nowrap">
                    Soon
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-semibold text-gray-200 mb-1.5">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-400 leading-relaxed max-w-[220px] mx-auto">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
