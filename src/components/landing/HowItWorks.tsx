const steps = [
  {
    number: '01',
    title: 'Create Your Formula',
    description: 'Set your parameters: liquidity thresholds, volume spikes, holder distribution, token age, and security checks. Name it something memorable.',
    color: 'from-arena-purple to-arena-blue',
  },
  {
    number: '02',
    title: 'Backtest Your Strategy',
    description: 'Run your formula against historical data to see how it would have performed. Refine your parameters before going live.',
    color: 'from-arena-blue to-arena-cyan',
  },
  {
    number: '03',
    title: 'Monitor in Real-Time',
    description: 'Your formula runs 24/7, scanning every new token launch. When a match is found, you\'re alerted instantly.',
    color: 'from-arena-cyan to-arena-purple',
  },
  {
    number: '04',
    title: 'Track Performance',
    description: 'Every match is recorded with price at discovery. Watch how your picks perform over 1hr, 24hr, and 7-day windows.',
    color: 'from-arena-purple to-arena-pink',
  },
  {
    number: '05',
    title: 'Compete & Share',
    description: 'Climb the leaderboard with your win rate. Share your winning formulas on Twitter, or copy strategies from top performers.',
    color: 'from-arena-pink to-arena-cyan',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How it works
          </h2>
          <p className="text-lg text-gray-400">
            From formula creation to leaderboard domination in five simple steps.
          </p>
        </div>
        
        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-arena-purple via-arena-cyan to-arena-purple hidden sm:block" />
          
          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Number indicator */}
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>
                </div>
                
                {/* Content */}
                <div className={`pl-24 md:pl-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-400">
                    {step.description}
                  </p>
                </div>
                
                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
