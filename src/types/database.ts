// Database types - aligned with Supabase schema

export type SubscriptionTier = 'free' | 'pro' | 'elite'

export interface EarnedBadge {
  id: string
  earned_at: string
}

export interface Profile {
  id: string
  username: string
  email: string
  avatar_url?: string | null
  bio?: string | null
  subscription_tier: SubscriptionTier
  badges: EarnedBadge[]
  created_at: string
  updated_at: string
}

export interface Formula {
  id: string
  user_id: string
  name: string
  description?: string | null
  is_public: boolean
  is_active: boolean
  
  // Formula parameters - Basic
  liquidity_min?: number | null
  liquidity_max?: number | null
  volume_24h_min?: number | null
  volume_24h_spike?: number | null
  holders_min?: number | null
  holders_max?: number | null
  token_age_max_hours?: number | null
  require_verified_contract: boolean
  require_honeypot_check: boolean
  require_liquidity_lock: boolean
  
  // Formula parameters - Enhanced (Launch Sniper, Momentum, Accumulation)
  token_age_min_minutes?: number | null
  buy_sell_ratio_1h_min?: number | null
  tx_count_1h_min?: number | null
  tx_count_24h_min?: number | null
  fdv_min?: number | null
  fdv_max?: number | null
  price_change_1h_min?: number | null
  price_change_1h_max?: number | null
  price_change_6h_min?: number | null
  price_change_6h_max?: number | null
  price_change_24h_min?: number | null
  price_change_24h_max?: number | null
  volume_1h_vs_6h_spike?: number | null
  volume_6h_vs_24h_spike?: number | null
  
  // Preset tracking
  preset_id?: string | null
  exit_hours?: number | null
  
  // Stats (denormalized)
  total_matches: number
  wins: number
  win_rate: number
  avg_return: number
  
  created_at: string
  updated_at: string
  
  // Relations (joined)
  profile?: Profile
}

export interface TokenMatch {
  id: string
  formula_id: string
  
  // Token info
  token_address: string
  token_name: string
  token_symbol: string
  chain: 'solana' | 'ethereum' | 'base'
  
  // Price data
  price_at_match: number
  price_1h?: number | null
  price_24h?: number | null
  price_7d?: number | null
  
  // Returns (point-in-time snapshots)
  return_1h?: number | null
  return_24h?: number | null
  return_7d?: number | null
  
  // Max price tracking
  price_high_24h?: number | null
  price_high_exit?: number | null
  return_max_24h?: number | null
  return_max_exit?: number | null
  
  // Token metadata at match time
  liquidity?: number | null
  volume_24h?: number | null
  holders?: number | null
  market_cap?: number | null
  
  // External links
  dexscreener_url?: string | null
  contract_verified: boolean
  
  // Status
  is_win?: boolean | null
  
  matched_at: string
  
  // Relations
  formula?: Formula
}

export interface Alert {
  id: string
  user_id: string
  formula_id: string
  token_match_id: string
  
  type: 'telegram' | 'discord' | 'email'
  status: 'pending' | 'sent' | 'failed'
  
  error_message?: string | null
  sent_at?: string | null
  created_at: string
  
  // Relations
  formula?: Formula
  token_match?: TokenMatch
}

export interface AlertSettings {
  id: string
  user_id: string
  
  telegram_enabled: boolean
  telegram_chat_id?: string | null
  
  discord_enabled: boolean
  discord_webhook_url?: string | null
  
  email_enabled: boolean
  
  // Throttling
  min_interval_seconds: number
  daily_limit: number
  
  created_at: string
  updated_at: string
}

export interface FormulaCopy {
  id: string
  original_formula_id: string
  copied_formula_id: string
  copied_by: string
  copied_at: string
}

export interface Clan {
  id: string
  name: string
  slug: string
  description?: string | null
  logo_url?: string | null
  telegram_link?: string | null
  owner_id: string
  is_public: boolean
  max_members: number
  member_count: number
  total_matches: number
  avg_win_rate: number
  created_at: string
  updated_at: string
}

export interface ClanMember {
  id: string
  clan_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

export interface UpdateClanInput {
  name?: string
  description?: string | null
  logo_url?: string | null
  telegram_link?: string | null
}

export interface UpdateMemberRoleInput {
  user_id: string
  role: 'owner' | 'admin' | 'member'
}

export interface LeaderboardEntry {
  rank: number
  formula_id: string
  formula_name: string
  user_id: string
  username: string
  avatar_url?: string | null
  win_rate: number
  total_matches: number
  avg_return: number
  is_public: boolean
}

// Competition Types
export type CompetitionType = 'daily_flip' | 'weekly' | 'head_to_head' | 'clan_war'
export type CompetitionStatus = 'upcoming' | 'active' | 'completed' | 'cancelled'

export interface Competition {
  id: string
  name: string
  description?: string | null
  type: CompetitionType
  status: CompetitionStatus
  starts_at: string
  ends_at: string
  entry_fee: number
  max_participants?: number | null
  min_participants: number
  formula_snapshot: boolean
  allow_multiple_formulas: boolean
  prizes: Record<string, string>
  participant_count: number
  challenger_id?: string | null
  challenged_id?: string | null
  clan_a_id?: string | null
  clan_b_id?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  
  // Computed fields (from API)
  seconds_remaining?: number
  is_entered?: boolean
  user_entry_id?: string | null
  live_status?: 'upcoming' | 'live' | 'ended'
  my_entry?: CompetitionEntry | null
}

export interface CompetitionEntry {
  id: string
  competition_id: string
  user_id: string
  formula_id: string
  joined_at: string
  final_rank?: number | null
  final_score?: number | null
  total_matches: number
  wins: number
  avg_return: number
  formula_snapshot?: Record<string, any> | null
  
  // Relations
  competition?: Competition
  formula?: Formula
  profile?: Profile
}

export interface CompetitionMatch {
  id: string
  competition_id: string
  entry_id: string
  token_match_id: string
  counted_at: string
}

export interface CompetitionLeaderboardEntry {
  rank: number
  entry_id: string
  user_id: string
  username: string
  avatar_url?: string | null
  formula_id?: string
  formula_name: string
  total_matches: number
  wins: number
  avg_return: number
  total_return: number
  win_rate?: number
  score?: number
  prize_awarded?: string | null
}

// API Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Form types for creating/updating
export interface CreateFormulaInput {
  name: string
  description?: string
  is_public?: boolean
  is_active?: boolean
  // Basic parameters
  liquidity_min?: number
  liquidity_max?: number
  volume_24h_min?: number
  volume_24h_spike?: number
  holders_min?: number
  holders_max?: number
  token_age_max_hours?: number
  require_verified_contract?: boolean
  require_honeypot_check?: boolean
  require_liquidity_lock?: boolean
  // Enhanced parameters
  token_age_min_minutes?: number
  buy_sell_ratio_1h_min?: number
  tx_count_1h_min?: number
  tx_count_24h_min?: number
  fdv_min?: number
  fdv_max?: number
  price_change_1h_min?: number
  price_change_1h_max?: number
  price_change_6h_min?: number
  price_change_6h_max?: number
  price_change_24h_min?: number
  price_change_24h_max?: number
  volume_1h_vs_6h_spike?: number
  volume_6h_vs_24h_spike?: number
  // Preset tracking
  preset_id?: string
  exit_hours?: number
}

export interface UpdateFormulaInput extends Partial<CreateFormulaInput> {
  id: string
}

export interface UpdateAlertSettingsInput {
  telegram_enabled?: boolean
  telegram_chat_id?: string
  discord_enabled?: boolean
  discord_webhook_url?: string
  email_enabled?: boolean
  min_interval_seconds?: number
  daily_limit?: number
}

// DexScreener API types
export interface DexScreenerToken {
  chainId: string
  dexId: string
  url: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceNative: string
  priceUsd: string
  txns: {
    m5: { buys: number; sells: number }
    h1: { buys: number; sells: number }
    h6: { buys: number; sells: number }
    h24: { buys: number; sells: number }
  }
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  fdv: number
  pairCreatedAt: number
}
