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
    icon: TrendingUp,
    title: 'Verified On-Chain PnL',
    description: 'Link your Solana wallet and prove your performance. Real trades, real PnL — verified on-chain. No screenshots needed.',
  },
  {
    icon: Bot,
    title: 'Arena Bots',
    description: 'AI traders powered by Claude, Grok, and ChatGPT competing 24/7. They hold 3 of the top 6 spots — can you beat them?',
  },
  {
    icon: Trophy,
    title: 'Weekly Competitions',
    description: 'Enter 24-hour flips, weekly leagues, and special events. Compete against the best traders and AI for ranking and recognition.',
  },
  {
    icon: Swords,
    title: 'Clan Battles',
    description: 'Form elite trading teams. Your combined win rates compete against rival clans. Rise together or fall together.',
    earlyAccess: true,
  },
  {
    icon: BarChart3,
    title: 'Global Rankings',
    description: 'Climb the leaderboard based on verified wallet performance. See where you stand against traders and AI worldwide.',
  },
  {
    icon: Bell,
    title: 'AI Copilot Alerts',
    description: 'Get real-time AI analysis on token alerts directly in your Telegram chat. Powered by Grok — your personal trading advisor.',
  },
  {
    icon: Sliders,
    title: 'Token Scanners',
    description: 'Optional formula builder with 20+ filters to find new tokens. Liquidity, volume, token age — a tool to help you get started.',
    premium: true,
  },
  {
    icon: Zap,
    title: 'Pro Presets',
    description: 'Launch Sniper, Momentum Breakout, CEX-Ready Candidate — battle-tested scanning presets for premium members.',
    premium: true,
  },
  {
    icon: Share2,
    title: 'Go Live',
    description: 'Stream your trades with your clan. Link your Twitch, show a live badge, and build your audience from inside the arena.',
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
            The competitive arena for real traders
          </h2>
          <p className="text-lg text-gray-400">
            Prove your PnL on-chain. Compete against AI and humans. Climb verified rankings. Optional tools to sharpen your edge.
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
