-- 019: Arena Bets - Mini prediction markets on memecoins
-- Points-based binary markets with auto-resolution via DexScreener

-- =============================================
-- USER POINTS
-- =============================================
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 500, -- starting balance
  total_earned INTEGER DEFAULT 0,
  total_wagered INTEGER DEFAULT 0,
  total_won INTEGER DEFAULT 0,
  win_count INTEGER DEFAULT 0,
  loss_count INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_daily_claim TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);

ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to user_points" ON user_points
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =============================================
-- ARENA MARKETS
-- =============================================
CREATE TABLE IF NOT EXISTS arena_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Token info
  token_address TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  chain TEXT DEFAULT 'solana',
  
  -- Market details
  market_type TEXT NOT NULL CHECK (market_type IN ('up_down', 'rug_call', 'moonshot')),
  question TEXT NOT NULL,
  description TEXT,
  
  -- Price tracking
  price_at_creation NUMERIC NOT NULL,
  price_at_resolution NUMERIC,
  
  -- Token metadata at creation
  liquidity NUMERIC,
  volume_24h NUMERIC,
  holder_count INTEGER,
  rugcheck_score NUMERIC,
  
  -- Timing
  resolve_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  
  -- Outcome
  outcome TEXT CHECK (outcome IN ('yes', 'no')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  
  -- Pool stats (denormalized for performance)
  total_pool INTEGER DEFAULT 0,
  yes_pool INTEGER DEFAULT 0,
  no_pool INTEGER DEFAULT 0,
  total_bettors INTEGER DEFAULT 0,
  
  -- Arena Bot predictions (stored as JSON)
  bot_predictions JSONB DEFAULT '{}',
  
  -- Links
  dexscreener_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arena_markets_status ON arena_markets(status);
CREATE INDEX IF NOT EXISTS idx_arena_markets_resolve_at ON arena_markets(resolve_at);
CREATE INDEX IF NOT EXISTS idx_arena_markets_token ON arena_markets(token_address);
CREATE INDEX IF NOT EXISTS idx_arena_markets_created ON arena_markets(created_at DESC);

ALTER TABLE arena_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read markets" ON arena_markets
  FOR SELECT USING (TRUE);

CREATE POLICY "Service role full access to arena_markets" ON arena_markets
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- =============================================
-- ARENA BETS
-- =============================================
CREATE TABLE IF NOT EXISTS arena_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES arena_markets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  position TEXT NOT NULL CHECK (position IN ('yes', 'no')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  
  -- Payout (set on resolution)
  payout INTEGER DEFAULT 0,
  is_winner BOOLEAN,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_arena_bets_market ON arena_bets(market_id);
CREATE INDEX IF NOT EXISTS idx_arena_bets_user ON arena_bets(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_arena_bets_unique ON arena_bets(market_id, user_id);

ALTER TABLE arena_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bets" ON arena_bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read bets on resolved markets" ON arena_bets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM arena_markets WHERE id = market_id AND status = 'resolved')
  );

CREATE POLICY "Service role full access to arena_bets" ON arena_bets
  FOR ALL USING (TRUE) WITH CHECK (TRUE);
