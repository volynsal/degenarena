import {
  Sliders,
  Bell,
  TrendingUp,
  Trophy,
  Radio,
  Zap,
  BarChart3,
  Swords,
  Bot,
  Orbit,
} from 'lucide-react'

interface Feature {
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>
  title: string
  description: React.ReactNode
  comingSoon?: boolean
  earlyAccess?: boolean
}

const features: Feature[] = [
  {
    icon: Trophy,
    title: 'Weekly Competitions',
    description: 'Enter 24-hour flips, weekly leagues, and special events. Compete against the best traders for ranking and recognition.',
  },
  {
    icon: Swords,
    title: 'Clan Battles',
    description: 'Form elite trading teams. Your combined win rates compete against rival clans. Rise together or fall together.',
    earlyAccess: true,
  },
  {
    icon: Sliders,
    title: 'Formulas & Presets',
    description: 'Scan new tokens with 20+ filters or use battle-tested presets. We offer these as a starting point but feel free to BYO; our platform is tool-agnostic.',
    earlyAccess: true,
  },
  {
    icon: TrendingUp,
    title: 'Verified Performance',
    description: 'Every match is tracked on-chain. Your win rate, average returns, and complete history — no faking, no hiding, and no need to connect your wallet.',
  },
  {
    icon: Bell,
    title: 'Instant Alerts',
    description: 'AI copilot to advise you on alerts instantly in the same chat, powered by Grok. Never miss a play.',
  },
  {
    icon: Radio,
    title: 'Go Live',
    description: 'Link your Twitch and stream your trades. Viewers watch directly inside — no switching tabs. Build your audience from the arena.',
  },
  {
    icon: BarChart3,
    title: 'Global Rankings',
    description: 'Climb the leaderboard. See where you stand against traders worldwide. The best rise to the top.',
  },
  {
    icon: Orbit,
    title: 'Galaxy',
    description: <>Prediction markets on proper memecoins and even <em className="line-through italic">shit</em>coins. Bet with points and build win streaks to unlock go live and clans.</>,
  },
  {
    icon: Bot,
    title: 'AI Challengers',
    description: 'Official AI traders running 24/7. Multiple LLMs competing in the arena — can you outperform them?',
    comingSoon: true,
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bracketed label */}
        <div className="text-center mb-6">
          <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-gray-500">
            [ Features ]
          </span>
        </div>

        {/* Section headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center max-w-3xl mx-auto mb-16">
          The complete arsenal for competitive degens.
        </h2>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] p-7 sm:p-8 transition-colors duration-300 group"
            >
              {/* Badges */}
              {feature.comingSoon && (
                <span className="absolute top-5 right-5 text-[10px] px-2.5 py-1 rounded-full bg-gradient-to-r from-arena-purple to-arena-cyan text-white font-semibold">
                  Coming Soon
                </span>
              )}
              {feature.earlyAccess && (
                <span className="absolute top-5 right-5 text-[10px] px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 font-semibold">
                  Free for early users
                </span>
              )}

              {/* Icon */}
              <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-5 group-hover:bg-white/[0.08] transition-colors">
                <feature.icon size={20} strokeWidth={1.5} className="text-arena-cyan" />
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
