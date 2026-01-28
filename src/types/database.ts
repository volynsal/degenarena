// Database types - aligned with Supabase schema

export interface Profile {
  id: string
  username: string
  email: string
  avatar_url?: string | null
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
  
  // Formula parameters
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
  
  // Returns
  return_1h?: number | null
  return_24h?: number | null
  return_7d?: number | null
  
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
