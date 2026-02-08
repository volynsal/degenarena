import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card'
import { 
  Sliders, 
  Bell, 
  TrendingUp, 
  Trophy, 
  Share2, 
  Zap,
  BarChart3,
  Swords,
  Bot
} from 'lucide-react'

const features = [
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
    title: 'Formula Builder',
    description: 'Optional tool to scan new tokens with 20+ filters. Liquidity, volume, token age, buy pressure — a great way to get started or sharpen your edge.',
  },
  {
    icon: TrendingUp,
    title: 'Verified Performance',
    description: 'Every match is tracked on-chain. Your win rate, average returns, and complete history — no faking, no hiding.',
  },
  {
    icon: Bell,
    title: 'Instant Alerts',
    description: 'Get notified via Telegram, Discord, or email the moment a token matches your criteria. Never miss a play.',
  },
  {
    icon: Share2,
    title: 'Formula Marketplace',
    description: 'Share winning strategies with the community or follow top performers. Full attribution, verified results.',
  },
  {
    icon: BarChart3,
    title: 'Global Rankings',
    description: 'Climb the leaderboard. See where you stand against traders worldwide. The best rise to the top.',
  },
  {
    icon: Zap,
    title: 'Strategy Presets',
    description: 'Launch Sniper, Momentum Breakout, CEX-Ready Candidate — battle-tested scanning presets to help you find opportunities.',
    premium: true,
  },
  {
    icon: Bot,
    title: 'Arena Bots',
    description: 'Official AI traders running 24/7. Multiple LLMs competing in the arena — can you outperform them?',
    comingSoon: true,
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            The complete arena for serious traders
          </h2>
          <p className="text-lg text-gray-400">
            Compete against AI and humans. Track verified performance. Enter competitions. The tools you need to prove your alpha.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} hover className="group relative">
              <CardContent>
                {'comingSoon' in feature && feature.comingSoon && (
                  <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-gradient-to-r from-arena-purple to-arena-cyan text-white font-medium">
                    Coming Soon
                  </span>
                )}
                {'premium' in feature && feature.premium && (
                  <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">
                    Premium
                  </span>
                )}
                {'earlyAccess' in feature && feature.earlyAccess && (
                  <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 font-medium">
                    Free for early users
                  </span>
                )}
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-arena-purple/20 to-arena-cyan/20 flex items-center justify-center mb-4 group-hover:from-arena-purple/30 group-hover:to-arena-cyan/30 transition-colors">
                  <feature.icon className="w-6 h-6 text-arena-cyan" />
                </div>
                <CardTitle className="mb-2">{feature.title}</CardTitle>
                <CardDescription className="text-gray-400">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
