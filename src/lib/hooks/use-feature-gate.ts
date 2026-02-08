'use client'

import { useState, useEffect } from 'react'

// =============================================
// Unlock thresholds — change these to adjust requirements
// =============================================
export const FEATURE_REQUIREMENTS = {
  clans: {
    predictionWins: 5,
    verifiedPnl: true,
    label: 'Clans',
  },
  goLive: {
    predictionWins: 10,
    verifiedPnl: true,
    label: 'Go Live',
  },
} as const

export type GatedFeature = keyof typeof FEATURE_REQUIREMENTS

export interface FeatureGateStatus {
  isUnlocked: boolean
  isLoading: boolean
  predictionWins: number
  requiredWins: number
  walletVerified: boolean
  requiresVerifiedPnl: boolean
}

export function useFeatureGate(feature: GatedFeature): FeatureGateStatus {
  const [predictionWins, setPredictionWins] = useState(0)
  const [walletVerified, setWalletVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const req = FEATURE_REQUIREMENTS[feature]

  useEffect(() => {
    let cancelled = false

    async function fetchGateData() {
      setIsLoading(true)

      try {
        // Fetch both in parallel
        const [pointsRes, walletRes] = await Promise.all([
          fetch('/api/arena-bets/points').then(r => r.json()).catch(() => null),
          fetch('/api/user/wallet').then(r => r.json()).catch(() => null),
        ])

        if (cancelled) return

        // Prediction market wins
        if (pointsRes?.data) {
          setPredictionWins(pointsRes.data.win_count ?? 0)
        }

        // Wallet verification
        if (walletRes?.data) {
          setWalletVerified(walletRes.data.wallet_verified === true)
        }
      } catch {
        // Fail closed — keep locked
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchGateData()
    return () => { cancelled = true }
  }, [])

  const winsOk = predictionWins >= req.predictionWins
  const pnlOk = !req.verifiedPnl || walletVerified

  return {
    isUnlocked: winsOk && pnlOk,
    isLoading,
    predictionWins,
    requiredWins: req.predictionWins,
    walletVerified,
    requiresVerifiedPnl: req.verifiedPnl,
  }
}
