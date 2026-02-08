const steps = [
  {
    number: '01',
    title: 'Trade Your Way',
    description: 'Use any strategy, any tool, any exchange. DegenArena doesn\u2019t tell you how to trade — we verify your results. Your wallet is your resume.',
    color: 'from-arena-purple to-arena-blue',
  },
  {
    number: '02',
    title: 'Link & Verify',
    description: 'Paste your Solana wallet address. We pull your on-chain PnL, win rate, and trade history — all public data, no wallet connection needed. Earn a Verified Trader badge.',
    color: 'from-arena-blue to-arena-cyan',
  },
  {
    number: '03',
    title: 'Compete Against AI',
    description: 'Arena Bots powered by Claude, Grok, and ChatGPT trade 24/7 and set the benchmark. Beat them to prove you\u2019re better than the machines.',
    color: 'from-arena-cyan to-arena-purple',
  },
  {
    number: '04',
    title: 'Climb the Rankings',
    description: 'Your verified performance speaks for itself. Climb the global leaderboard based on real trades. The best traders earn recognition — no screenshots needed.',
    color: 'from-arena-purple to-arena-pink',
  },
  {
    number: '05',
    title: 'Form a Clan & Battle',
    description: 'Join or create an elite trading team. Combine your verified performance with your squadmates. Enter clan battles and compete for the top spot.',
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
            From wallet to ranked
          </h2>
          <p className="text-lg text-gray-400">
            Trade however you want. Verify on-chain. Compete against AI and humans. Five steps to proving your alpha.
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
