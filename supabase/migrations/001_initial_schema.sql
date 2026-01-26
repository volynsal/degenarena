-- DegenArena Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS / PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FORMULAS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Formula parameters
  liquidity_min NUMERIC,
  liquidity_max NUMERIC,
  volume_24h_min NUMERIC,
  volume_24h_spike NUMERIC, -- percentage threshold
  holders_min INTEGER,
  holders_max INTEGER,
  token_age_max_hours INTEGER,
  require_verified_contract BOOLEAN DEFAULT TRUE,
  require_honeypot_check BOOLEAN DEFAULT TRUE,
  require_liquidity_lock BOOLEAN DEFAULT FALSE,
  
  -- Stats (denormalized for performance)
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  avg_return NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_formulas_user_id ON formulas(user_id);
CREATE INDEX IF NOT EXISTS idx_formulas_is_public ON formulas(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_formulas_is_active ON formulas(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_formulas_win_rate ON formulas(win_rate DESC);

-- Enable RLS
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for formulas
CREATE POLICY "Users can view their own formulas" ON formulas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public formulas" ON formulas
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can create their own formulas" ON formulas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own formulas" ON formulas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own formulas" ON formulas
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- TOKEN MATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS token_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formula_id UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
  
  -- Token info
  token_address TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  chain TEXT DEFAULT 'solana' CHECK (chain IN ('solana', 'ethereum', 'base')),
  
  -- Price data
  price_at_match NUMERIC NOT NULL,
  price_1h NUMERIC,
  price_24h NUMERIC,
  price_7d NUMERIC,
  
  -- Returns (calculated)
  return_1h NUMERIC,
  return_24h NUMERIC,
  return_7d NUMERIC,
  
  -- Token metadata at match time
  liquidity NUMERIC,
  volume_24h NUMERIC,
  holders INTEGER,
  market_cap NUMERIC,
  
  -- External links
  dexscreener_url TEXT,
  contract_verified BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_win BOOLEAN, -- determined after 24h
  
  matched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_matches_formula_id ON token_matches(formula_id);
CREATE INDEX IF NOT EXISTS idx_token_matches_matched_at ON token_matches(matched_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_matches_token_address ON token_matches(token_address);

-- Enable RLS
ALTER TABLE token_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_matches
CREATE POLICY "Users can view matches for their formulas" ON token_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM formulas 
      WHERE formulas.id = token_matches.formula_id 
      AND (formulas.user_id = auth.uid() OR formulas.is_public = TRUE)
    )
  );

CREATE POLICY "Service role can insert matches" ON token_matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update matches" ON token_matches
  FOR UPDATE USING (true);

-- =============================================
-- ALERTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  formula_id UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
  token_match_id UUID NOT NULL REFERENCES token_matches(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN ('telegram', 'discord', 'email')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);

-- Enable RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alerts
CREATE POLICY "Users can view their own alerts" ON alerts
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- ALERT SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS alert_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  telegram_enabled BOOLEAN DEFAULT FALSE,
  telegram_chat_id TEXT,
  
  discord_enabled BOOLEAN DEFAULT FALSE,
  discord_webhook_url TEXT,
  
  email_enabled BOOLEAN DEFAULT TRUE,
  
  -- Throttling
  min_interval_seconds INTEGER DEFAULT 60,
  daily_limit INTEGER DEFAULT 100,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alert_settings
CREATE POLICY "Users can view their own alert settings" ON alert_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alert settings" ON alert_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert settings" ON alert_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- FORMULA COPIES TABLE (for tracking who copied what)
-- =============================================
CREATE TABLE IF NOT EXISTS formula_copies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_formula_id UUID NOT NULL REFERENCES formulas(id) ON DELETE SET NULL,
  copied_formula_id UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
  copied_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  copied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_formula_copies_original ON formula_copies(original_formula_id);

-- Enable RLS
ALTER TABLE formula_copies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view copies of their formulas" ON formula_copies
  FOR SELECT USING (
    auth.uid() = copied_by OR
    EXISTS (
      SELECT 1 FROM formulas 
      WHERE formulas.id = formula_copies.original_formula_id 
      AND formulas.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create copies" ON formula_copies
  FOR INSERT WITH CHECK (auth.uid() = copied_by);

-- =============================================
-- LEADERBOARD VIEW (for efficient querying)
-- =============================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY f.win_rate DESC, f.total_matches DESC) as rank,
  f.id as formula_id,
  f.name as formula_name,
  f.user_id,
  p.username,
  p.avatar_url,
  f.win_rate,
  f.total_matches,
  f.avg_return,
  f.is_public
FROM formulas f
JOIN profiles p ON f.user_id = p.id
WHERE f.is_public = TRUE 
  AND f.total_matches >= 10  -- Minimum matches for ranking
ORDER BY f.win_rate DESC, f.total_matches DESC;

-- =============================================
-- FUNCTIONS FOR UPDATING FORMULA STATS
-- =============================================
CREATE OR REPLACE FUNCTION update_formula_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_total_matches INTEGER;
  v_wins INTEGER;
  v_win_rate NUMERIC;
  v_avg_return NUMERIC;
BEGIN
  -- Calculate stats from token_matches
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_win = TRUE),
    COALESCE(AVG(return_24h), 0)
  INTO v_total_matches, v_wins, v_avg_return
  FROM token_matches
  WHERE formula_id = COALESCE(NEW.formula_id, OLD.formula_id);
  
  -- Calculate win rate
  IF v_total_matches > 0 THEN
    v_win_rate := (v_wins::NUMERIC / v_total_matches::NUMERIC) * 100;
  ELSE
    v_win_rate := 0;
  END IF;
  
  -- Update formula stats
  UPDATE formulas
  SET 
    total_matches = v_total_matches,
    wins = v_wins,
    win_rate = ROUND(v_win_rate, 2),
    avg_return = ROUND(v_avg_return, 2),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.formula_id, OLD.formula_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update formula stats when matches are added/updated
DROP TRIGGER IF EXISTS update_formula_stats_trigger ON token_matches;
CREATE TRIGGER update_formula_stats_trigger
  AFTER INSERT OR UPDATE OF is_win, return_24h ON token_matches
  FOR EACH ROW EXECUTE FUNCTION update_formula_stats();

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS formulas_updated_at ON formulas;
CREATE TRIGGER formulas_updated_at
  BEFORE UPDATE ON formulas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS alert_settings_updated_at ON alert_settings;
CREATE TRIGGER alert_settings_updated_at
  BEFORE UPDATE ON alert_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
