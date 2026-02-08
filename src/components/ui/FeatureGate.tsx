'use client'

import Link from 'next/link'
import { Lock, Trophy, Shield, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from './Card'
import { Button } from './Button'
import type { FeatureGateStatus } from '@/lib/hooks/use-feature-gate'

interface FeatureGateProps {
  status: FeatureGateStatus
  featureName: string
  children?: React.ReactNode
}

/**
 * Wraps a page/section. Shows locked state if requirements aren't met,
 * otherwise renders children normally.
 */
export function FeatureGate({ status, featureName, children }: FeatureGateProps) {
  if (status.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-arena-cyan animate-spin" />
      </div>
    )
  }

  if (status.isUnlocked) {
    return <>{children}</>
  }

  const winsOk = status.predictionWins >= status.requiredWins
  const pnlOk = !status.requiresVerifiedPnl || status.walletVerified

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {featureName}
          </span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Unlock this feature by proving your skills
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-8 sm:p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-arena-purple/20 to-arena-cyan/20 border border-white/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            {featureName} is locked
          </h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Complete the requirements below to unlock {featureName.toLowerCase()}. 
            This keeps the feature high-quality and rewards active traders.
          </p>

          {/* Requirements checklist */}
          <div className="space-y-4 max-w-sm mx-auto text-left">
            {/* Prediction market wins */}
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${
              winsOk
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-white/[0.02] border-white/10'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                winsOk
                  ? 'bg-green-500/20'
                  : 'bg-arena-purple/20'
              }`}>
                {winsOk ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Trophy className="w-5 h-5 text-arena-purple" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${winsOk ? 'text-green-400' : 'text-white'}`}>
                  Win {status.requiredWins} Galaxy Arena predictions
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {winsOk
                    ? `Done — ${status.predictionWins} wins`
                    : `${status.predictionWins} / ${status.requiredWins} wins`
                  }
                </p>
              </div>
            </div>

            {/* Verified PnL */}
            {status.requiresVerifiedPnl && (
              <div className={`flex items-start gap-3 p-4 rounded-lg border ${
                pnlOk
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-white/[0.02] border-white/10'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  pnlOk
                    ? 'bg-green-500/20'
                    : 'bg-arena-cyan/20'
                }`}>
                  {pnlOk ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Shield className="w-5 h-5 text-arena-cyan" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${pnlOk ? 'text-green-400' : 'text-white'}`}>
                    Verify your wallet PnL
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {pnlOk
                      ? 'Verified'
                      : 'Link your Solana wallet and meet the trading threshold'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            {!winsOk && (
              <Link href="/arena-bets">
                <Button variant="primary" size="lg">
                  <Trophy className="w-4 h-4 mr-2" />
                  Play Galaxy Arena
                </Button>
              </Link>
            )}
            {status.requiresVerifiedPnl && !pnlOk && (
              <Link href="/settings">
                <Button variant="secondary" size="lg">
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Wallet
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
