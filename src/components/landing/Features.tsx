import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card'
import { 
  Sliders, 
  Bell, 
  TrendingUp, 
  Trophy, 
  Share2, 
  Shield,
  Zap,
  BarChart3,
  Users
} from 'lucide-react'

const features = [
  {
    icon: Sliders,
    title: 'Formula Builder',
    description: 'Create custom token filters with liquidity, volume, holder count, and more. Save and refine your winning strategies.',
  },
  {
    icon: Bell,
    title: 'Real-Time Alerts',
    description: 'Get instant notifications via Telegram, Discord, or email when tokens match your formula criteria.',
  },
  {
    icon: TrendingUp,
    title: 'Performance Tracking',
    description: 'Every match is tracked. See your win rate, average returns, and performance over 24hr, 7-day, and 30-day periods.',
  },
  {
    icon: Trophy,
    title: 'Competitive Leaderboards',
    description: 'Rank your formulas against others. Climb the daily, weekly, and all-time leaderboards.',
  },
  {
    icon: Share2,
    title: 'Formula Sharing',
    description: 'Share your winning formulas or clone strategies from top performers with full attribution.',
  },
  {
    icon: Shield,
    title: 'Security Checks',
    description: 'Built-in honeypot detection, contract verification, and liquidity lock checks to filter out scams.',
  },
  {
    icon: Zap,
    title: 'Multi-Chain Support',
    description: 'Monitor Solana at launch, with Ethereum, Base, and more chains coming soon.',
  },
  {
    icon: BarChart3,
    title: 'Performance History',
    description: 'View your complete track record since formula creation. Analyze win rates, returns, and refine your strategy over time.',
  },
  {
    icon: Users,
    title: 'Community Formulas',
    description: 'Discover trending formulas, upvote the best ones, and learn from the community.',
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
            Everything you need to find alpha
          </h2>
          <p className="text-lg text-gray-400">
            A complete toolkit for building, testing, and tracking your token-finding strategies.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} hover className="group">
              <CardContent>
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
