import { Trophy, Swords, Orbit, Sliders } from 'lucide-react'

const pillars = [
  {
    icon: Trophy,
    label: 'Competitions',
    headline: 'Go Live. Compete for Real.',
    description:
      'Enter 24-hour flips, weekly leagues, and special events. Stream your trades on Twitch while viewers watch inside the platform.',
    details: ['Weekly prize pools', 'Live streaming', 'Verified results'],
    color: '#9945FF',
    borderColor: 'border-arena-purple/30',
    hoverBorder: 'hover:border-arena-purple/60',
    iconColor: 'text-arena-purple',
  },
  {
    icon: Swords,
    label: 'Clans',
    headline: 'Build Your FaZe. Battle Other Clans.',
    description:
      'Form elite trading collectives. Combine win rates, climb clan rankings, and enter organized clan wars.',
    details: ['Squad competition', 'Combined leaderboards', 'Clan Wars'],
    color: '#F472B6',
    borderColor: 'border-arena-pink/30',
    hoverBorder: 'hover:border-arena-pink/60',
    iconColor: 'text-arena-pink',
  },
  {
    icon: Orbit,
    label: 'Galaxy',
    headline: 'Prediction Markets for the Trenches.',
    description:
      'Prediction markets specifically designed for memecoins. Express your view on what drives the culture — in real time.',
    details: ['On-chain vetting', 'Rug Shield', 'Points-based', 'CT markets'],
    color: '#14F195',
    borderColor: 'border-arena-cyan/30',
    hoverBorder: 'hover:border-arena-cyan/60',
    iconColor: 'text-arena-cyan',
  },
  {
    icon: Sliders,
    label: 'Formulas',
    headline: 'Your Scanner. Your Rules.',
    description:
      'Build custom token scanners with 20+ filters or use battle-tested presets. Get alerted the moment a token matches your criteria.',
    details: ['20+ filters', 'Presets', 'Real-time alerts'],
    color: '#4F46E5',
    borderColor: 'border-arena-blue/30',
    hoverBorder: 'hover:border-arena-blue/60',
    iconColor: 'text-arena-blue',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bracketed label */}
        <div className="text-center mb-6">
          <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-gray-500">
            [ The Arena ]
          </span>
        </div>

        {/* Section headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center mx-auto mb-16 lg:whitespace-nowrap">
          Everything you need to compete, connect, and win.
        </h2>

        {/* 2x2 pillar grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.label}
              className={`relative rounded-2xl border ${pillar.borderColor} ${pillar.hoverBorder} bg-white/[0.02] p-8 sm:p-10 transition-colors duration-300 group`}
            >
              {/* Accent bar on top */}
              <div
                className="absolute top-0 left-8 right-8 h-px"
                style={{ backgroundColor: pillar.color, opacity: 0.4 }}
              />

              {/* Icon + label */}
              <div className="flex items-center gap-3 mb-5">
                <pillar.icon
                  size={24}
                  strokeWidth={1.5}
                  className={`${pillar.iconColor} opacity-70 group-hover:opacity-100 transition-opacity`}
                />
                <span
                  className="text-xs font-semibold tracking-[0.2em] uppercase"
                  style={{ color: pillar.color }}
                >
                  {pillar.label}
                </span>
              </div>

              {/* Headline */}
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">
                {pillar.headline}
              </h3>

              {/* Description */}
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base mb-6">
                {pillar.description}
              </p>

              {/* Detail chips */}
              <div className="flex flex-wrap gap-2">
                {pillar.details.map((detail) => (
                  <span
                    key={detail}
                    className="text-xs px-3 py-1 rounded-full border border-white/10 text-gray-400"
                  >
                    {detail}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
