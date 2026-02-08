-- 018: Wallet Verification & PnL Tracking
-- Adds wallet address to profiles and creates wallet_stats table for cached PnL data

-- Add wallet_address to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_verified_at TIMESTAMPTZ;

-- Create unique index on wallet_address (one wallet per user, one user per wallet)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_wallet_address 
  ON profiles(wallet_address) WHERE wallet_address IS NOT NULL;

-- Wallet stats table - cached PnL data from external APIs
CREATE TABLE IF NOT EXISTS wallet_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  
  -- Summary stats
  total_pnl_usd NUMERIC DEFAULT 0,
  total_invested_usd NUMERIC DEFAULT 0,
  total_sold_usd NUMERIC DEFAULT 0,
  realized_pnl_usd NUMERIC DEFAULT 0,
  unrealized_pnl_usd NUMERIC DEFAULT 0,
  
  -- Trade counts
  total_tokens_traded INTEGER DEFAULT 0,
  total_buy_transactions INTEGER DEFAULT 0,
  total_sell_transactions INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  
  -- Win/loss (tokens with positive realized PnL vs negative)
  winning_tokens INTEGER DEFAULT 0,
  losing_tokens INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  
  -- Time-windowed PnL
  pnl_1d NUMERIC DEFAULT 0,
  pnl_7d NUMERIC DEFAULT 0,
  pnl_30d NUMERIC DEFAULT 0,
  
  -- Best/worst trades
  best_trade_token TEXT,
  best_trade_pnl NUMERIC DEFAULT 0,
  worst_trade_token TEXT,
  worst_trade_pnl NUMERIC DEFAULT 0,
  
  -- Data source
  data_source TEXT DEFAULT 'birdeye', -- 'birdeye' or 'solanatracker'
  
  -- Timestamps
  last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One stats row per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_stats_user_id ON wallet_stats(user_id);

-- Index for looking up by wallet
CREATE INDEX IF NOT EXISTS idx_wallet_stats_wallet ON wallet_stats(wallet_address);

-- Enable RLS
ALTER TABLE wallet_stats ENABLE ROW LEVEL SECURITY;

-- Users can read their own stats
CREATE POLICY "Users can read own wallet stats" ON wallet_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything (for cron updates)
CREATE POLICY "Service role full access to wallet stats" ON wallet_stats
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Public can read wallet stats (for profile pages)
CREATE POLICY "Public can read wallet stats" ON wallet_stats
  FOR SELECT USING (TRUE);
