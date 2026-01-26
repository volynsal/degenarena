import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Copy, 
  Twitter,
  ArrowRight,
  Shield,
  Clock,
  Users,
  DollarSign
} from 'lucide-react'

// Public formula page - accessible via share link
export default async function PublicFormulaPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: formula } = await supabase
    .from('formulas')
    .select('*, profile:profiles(username, avatar_url)')
    .eq('id', params.id)
    .eq('is_public', true)
    .single()
  
  if (!formula) {
    return (
      <div className="min-h-screen bg-arena-darker flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold text-white mb-2">Formula Not Found</h1>
            <p className="text-gray-400 mb-6">This formula doesn't exist or is private.</p>
            <Link href="/">
              <Button variant="primary">Go to DegenArena</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  const username = (formula.profile as any)?.username || 'Anonymous'
  
  return (
    <div className="min-h-screen bg-arena-darker">
      {/* Header */}
      <nav className="border-b border-white/5 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="DegenArena" className="w-10 h-10 rounded-lg" />
            <span className="text-xl font-bold gradient-text">DegenArena</span>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">
              Sign Up Free
            </Button>
          </Link>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Formula Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-arena-purple/20 text-arena-purple text-sm mb-4">
            <Trophy className="w-4 h-4" />
            Public Formula
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{formula.name}</h1>
          <p className="text-gray-400">
            Created by <span className="text-arena-cyan">@{username}</span>
          </p>
          {formula.description && (
            <p className="text-gray-400 mt-4 max-w-xl mx-auto">{formula.description}</p>
          )}
        </div>
        
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card glow>
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-3xl font-bold text-white">{formula.total_matches}</p>
              <p className="text-sm text-gray-500">Total Matches</p>
            </CardContent>
          </Card>
          
          <Card glow>
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-arena-cyan" />
              <p className="text-3xl font-bold text-white">{formula.win_rate}%</p>
              <p className="text-sm text-gray-500">Win Rate</p>
            </CardContent>
          </Card>
          
          <Card glow>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-arena-cyan" />
              <p className={`text-3xl font-bold ${
                formula.avg_return >= 0 ? 'text-arena-cyan' : 'text-red-400'
              }`}>
                {formula.avg_return >= 0 ? '+' : ''}{formula.avg_return}%
              </p>
              <p className="text-sm text-gray-500">Avg Return</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Formula Parameters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Formula Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-arena-cyan" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Liquidity Range</p>
                  <p className="text-white">
                    ${(formula.liquidity_min || 0).toLocaleString()} - ${(formula.liquidity_max || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-arena-cyan" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Min 24h Volume</p>
                  <p className="text-white">${(formula.volume_24h_min || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Users className="w-5 h-5 text-arena-cyan" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Holder Range</p>
                  <p className="text-white">
                    {(formula.holders_min || 0).toLocaleString()} - {(formula.holders_max || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-arena-cyan" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Max Token Age</p>
                  <p className="text-white">{formula.token_age_max_hours || 24} hours</p>
                </div>
              </div>
            </div>
            
            {/* Security flags */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-arena-purple" />
                <span className="text-sm text-gray-400">Security Requirements</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {formula.require_verified_contract && (
                  <span className="px-3 py-1 rounded-full bg-arena-cyan/20 text-arena-cyan text-sm">
                    Verified Contract
                  </span>
                )}
                {formula.require_honeypot_check && (
                  <span className="px-3 py-1 rounded-full bg-arena-cyan/20 text-arena-cyan text-sm">
                    Honeypot Check
                  </span>
                )}
                {formula.require_liquidity_lock && (
                  <span className="px-3 py-1 rounded-full bg-arena-cyan/20 text-arena-cyan text-sm">
                    Liquidity Lock
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* CTA */}
        <Card className="border-arena-purple/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold text-white mb-2">Want to use this formula?</h2>
            <p className="text-gray-400 mb-6">
              Sign up for DegenArena to copy this formula and start finding tokens.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/signup?copy=${params.id}`}>
                <Button variant="primary" size="lg">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Formula
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `Check out this formula on DegenArena! 🎯\n\n"${formula.name}" by @${username}\n📊 ${formula.win_rate}% win rate\n💰 ${formula.avg_return >= 0 ? '+' : ''}${formula.avg_return}% avg return\n\n`
                )}&url=${encodeURIComponent(`https://degenarena.com/f/${params.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="lg">
                  <Twitter className="w-4 h-4 mr-2" />
                  Share on X
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
