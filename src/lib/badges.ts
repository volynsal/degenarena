// Badge Definitions for DegenArena
// Achievement badges earned through platform activity

import type { SubscriptionTier } from '@/types/database'

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string // Emoji or icon name
  category: 'milestone' | 'performance' | 'social' | 'special'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// All available badges
export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  // === MILESTONE BADGES ===
  first_formula: {
    id: 'first_formula',
    name: 'Formula Architect',
    description: 'Created your first formula',
    icon: '🧪',
    category: 'milestone',
    rarity: 'common',
  },
  formula_master: {
    id: 'formula_master',
    name: 'Formula Master',
    description: 'Created 10 formulas',
    icon: '🔬',
    category: 'milestone',
    rarity: 'rare',
  },
  first_match: {
    id: 'first_match',
    name: 'First Blood',
    description: 'Got your first token match',
    icon: '🎯',
    category: 'milestone',
    rarity: 'common',
  },
  hundred_matches: {
    id: 'hundred_matches',
    name: 'Match Machine',
    description: 'Reached 100 total matches',
    icon: '💯',
    category: 'milestone',
    rarity: 'rare',
  },
  
  // === PERFORMANCE BADGES ===
  first_win: {
    id: 'first_win',
    name: 'Winner Winner',
    description: 'Got your first winning trade',
    icon: '🏆',
    category: 'performance',
    rarity: 'common',
  },
  first_2x: {
    id: 'first_2x',
    name: 'Double Up',
    description: 'Achieved a 2x return on a match',
    icon: '✌️',
    category: 'performance',
    rarity: 'rare',
  },
  first_5x: {
    id: 'first_5x',
    name: 'High Roller',
    description: 'Achieved a 5x return on a match',
    icon: '🖐️',
    category: 'performance',
    rarity: 'epic',
  },
  first_10x: {
    id: 'first_10x',
    name: 'Degen Legend',
    description: 'Achieved a 10x return on a match',
    icon: '🔟',
    category: 'performance',
    rarity: 'legendary',
  },
  whale_hunter: {
    id: 'whale_hunter',
    name: 'Whale Hunter',
    description: 'Caught a token before a major whale buy',
    icon: '🐋',
    category: 'performance',
    rarity: 'epic',
  },
  win_streak_5: {
    id: 'win_streak_5',
    name: 'Hot Streak',
    description: '5 winning matches in a row',
    icon: '🔥',
    category: 'performance',
    rarity: 'rare',
  },
  win_streak_10: {
    id: 'win_streak_10',
    name: 'On Fire',
    description: '10 winning matches in a row',
    icon: '🌋',
    category: 'performance',
    rarity: 'epic',
  },
  
  // === SOCIAL BADGES ===
  clan_founder: {
    id: 'clan_founder',
    name: 'Clan Founder',
    description: 'Created a clan',
    icon: '⚔️',
    category: 'social',
    rarity: 'rare',
  },
  clan_member: {
    id: 'clan_member',
    name: 'Team Player',
    description: 'Joined a clan',
    icon: '🤝',
    category: 'social',
    rarity: 'common',
  },
  formula_shared: {
    id: 'formula_shared',
    name: 'Open Source',
    description: 'Made a formula public',
    icon: '📤',
    category: 'social',
    rarity: 'common',
  },
  formula_copied: {
    id: 'formula_copied',
    name: 'Trendsetter',
    description: 'Your formula was copied by another user',
    icon: '📋',
    category: 'social',
    rarity: 'rare',
  },
  leaderboard_top10: {
    id: 'leaderboard_top10',
    name: 'Top 10',
    description: 'Reached top 10 on the leaderboard',
    icon: '🏅',
    category: 'social',
    rarity: 'epic',
  },
  leaderboard_top3: {
    id: 'leaderboard_top3',
    name: 'Podium Finisher',
    description: 'Reached top 3 on the leaderboard',
    icon: '🥇',
    category: 'social',
    rarity: 'legendary',
  },
  
  // === SPECIAL BADGES ===
  early_adopter: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined during beta',
    icon: '🌟',
    category: 'special',
    rarity: 'legendary',
  },
  og_member: {
    id: 'og_member',
    name: 'OG Member',
    description: 'One of the first 100 users',
    icon: '👑',
    category: 'special',
    rarity: 'legendary',
  },
}

// Rarity colors for UI
export const RARITY_COLORS = {
  common: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
  rare: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  epic: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  legendary: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
}

// Subscription tier display info
export const TIER_INFO: Record<SubscriptionTier, { name: string; color: string; icon: string }> = {
  free: {
    name: 'Free',
    color: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
    icon: '⚪',
  },
  pro: {
    name: 'Pro',
    color: 'text-arena-purple bg-arena-purple/10 border-arena-purple/30',
    icon: '💎',
  },
  elite: {
    name: 'Elite',
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    icon: '👑',
  },
}

// Helper to get badge info
export function getBadge(id: string): BadgeDefinition | null {
  return BADGE_DEFINITIONS[id] || null
}

// Category labels
export const BADGE_CATEGORIES = {
  milestone: 'Milestones',
  performance: 'Performance',
  social: 'Social',
  special: 'Special',
}
