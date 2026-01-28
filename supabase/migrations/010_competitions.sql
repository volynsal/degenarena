-- Competitions System Schema
-- Supports: 24-hour flips, weekly competitions, head-to-head battles

-- =============================================
-- COMPETITIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Competition type
  type TEXT NOT NULL CHECK (type IN ('daily_flip', 'weekly', 'head_to_head', 'clan_war')),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  
  -- Timing
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  
  -- Entry requirements
  entry_fee INTEGER DEFAULT 0, -- Future: could be points or tokens
  max_participants INTEGER, -- NULL = unlimited
  min_participants INTEGER DEFAULT 2,
  
  -- Rules
  formula_snapshot BOOLEAN DEFAULT TRUE, -- Lock formula params at entry
  allow_multiple_formulas BOOLEAN DEFAULT FALSE, -- Can user enter multiple formulas?
  
  -- Prizes (stored as JSON for flexibility)
  prizes JSONB DEFAULT '{"1st": "gold_trophy", "2nd": "silver_trophy", "3rd": "bronze_trophy"}'::jsonb,
  
  -- Stats (denormalized)
  participant_count INTEGER DEFAULT 0,
  
  -- For head-to-head
  challenger_id UUID REFERENCES profiles(id),
  challenged_id UUID REFERENCES profiles(id),
  
  -- For clan wars
  clan_a_id UUID REFERENCES clans(id),
  clan_b_id UUID REFERENCES clans(id),
  
  -- Creator (for custom competitions)
  created_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitions_status ON competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_type ON competitions(type);
CREATE INDEX IF NOT EXISTS idx_competitions_starts_at ON competitions(starts_at);
CREATE INDEX IF NOT EXISTS idx_competitions_ends_at ON competitions(ends_at);

-- Enable RLS
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;

-- Everyone can view competitions
CREATE POLICY "Competitions are viewable by everyone" ON competitions
  FOR SELECT USING (true);

-- Only admins/system can create public competitions (for now)
CREATE POLICY "Users can create head-to-head competitions" ON competitions
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND type = 'head_to_head'
  );

-- =============================================
-- COMPETITION ENTRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS competition_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  formula_id UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
  
  -- For clan competitions
  clan_id UUID REFERENCES clans(id),
  
  -- Snapshot of formula parameters at entry time (if formula_snapshot = true)
  formula_snapshot JSONB,
  
  -- Results (calculated when competition ends)
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  total_return NUMERIC DEFAULT 0,
  avg_return NUMERIC DEFAULT 0,
  best_match_return NUMERIC,
  worst_match_return NUMERIC,
  
  -- Final ranking
  final_rank INTEGER,
  prize_awarded TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'disqualified', 'withdrawn')),
  
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate entries (same user/formula in same competition)
  UNIQUE(competition_id, user_id, formula_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competition_entries_competition ON competition_entries(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_user ON competition_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_entries_formula ON competition_entries(formula_id);

-- Enable RLS
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;

-- Users can view all entries in competitions they're part of
CREATE POLICY "Competition entries are viewable" ON competition_entries
  FOR SELECT USING (true);

-- Users can enter competitions
CREATE POLICY "Users can enter competitions" ON competition_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can withdraw their own entries
CREATE POLICY "Users can withdraw entries" ON competition_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- COMPETITION MATCHES TABLE
-- Links token_matches to competition entries for tracking
-- =============================================
CREATE TABLE IF NOT EXISTS competition_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES competition_entries(id) ON DELETE CASCADE,
  token_match_id UUID NOT NULL REFERENCES token_matches(id) ON DELETE CASCADE,
  
  -- Denormalized for quick access
  return_24h NUMERIC,
  is_win BOOLEAN,
  
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entry_id, token_match_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competition_matches_competition ON competition_matches(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_matches_entry ON competition_matches(entry_id);

-- Enable RLS
ALTER TABLE competition_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Competition matches are viewable" ON competition_matches
  FOR SELECT USING (true);

-- =============================================
-- FUNCTION: Update competition participant count
-- =============================================
CREATE OR REPLACE FUNCTION update_competition_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE competitions 
    SET participant_count = participant_count + 1,
        updated_at = NOW()
    WHERE id = NEW.competition_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE competitions 
    SET participant_count = participant_count - 1,
        updated_at = NOW()
    WHERE id = OLD.competition_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_competition_participants ON competition_entries;
CREATE TRIGGER update_competition_participants
  AFTER INSERT OR DELETE ON competition_entries
  FOR EACH ROW EXECUTE FUNCTION update_competition_participant_count();

-- =============================================
-- FUNCTION: Calculate competition entry results
-- =============================================
CREATE OR REPLACE FUNCTION calculate_entry_results(p_entry_id UUID)
RETURNS void AS $$
DECLARE
  v_total_matches INTEGER;
  v_wins INTEGER;
  v_total_return NUMERIC;
  v_avg_return NUMERIC;
  v_best NUMERIC;
  v_worst NUMERIC;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_win = TRUE),
    COALESCE(SUM(return_24h), 0),
    COALESCE(AVG(return_24h), 0),
    MAX(return_24h),
    MIN(return_24h)
  INTO v_total_matches, v_wins, v_total_return, v_avg_return, v_best, v_worst
  FROM competition_matches
  WHERE entry_id = p_entry_id;
  
  UPDATE competition_entries
  SET 
    total_matches = v_total_matches,
    wins = v_wins,
    total_return = ROUND(v_total_return, 2),
    avg_return = ROUND(v_avg_return, 2),
    best_match_return = v_best,
    worst_match_return = v_worst
  WHERE id = p_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCTION: Finalize competition rankings
-- =============================================
CREATE OR REPLACE FUNCTION finalize_competition(p_competition_id UUID)
RETURNS void AS $$
DECLARE
  v_entry RECORD;
  v_rank INTEGER := 0;
  v_prizes JSONB;
BEGIN
  -- Get prizes config
  SELECT prizes INTO v_prizes FROM competitions WHERE id = p_competition_id;
  
  -- Calculate results for all entries first
  FOR v_entry IN 
    SELECT id FROM competition_entries WHERE competition_id = p_competition_id
  LOOP
    PERFORM calculate_entry_results(v_entry.id);
  END LOOP;
  
  -- Assign rankings (by total_return, then by wins, then by avg_return)
  FOR v_entry IN 
    SELECT id 
    FROM competition_entries 
    WHERE competition_id = p_competition_id 
      AND status = 'active'
    ORDER BY total_return DESC, wins DESC, avg_return DESC
  LOOP
    v_rank := v_rank + 1;
    
    UPDATE competition_entries
    SET 
      final_rank = v_rank,
      prize_awarded = CASE 
        WHEN v_rank = 1 THEN v_prizes->>'1st'
        WHEN v_rank = 2 THEN v_prizes->>'2nd'
        WHEN v_rank = 3 THEN v_prizes->>'3rd'
        ELSE NULL
      END
    WHERE id = v_entry.id;
  END LOOP;
  
  -- Mark competition as completed
  UPDATE competitions
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_competition_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VIEW: Active competitions with entry counts
-- =============================================
CREATE OR REPLACE VIEW active_competitions AS
SELECT 
  c.*,
  CASE 
    WHEN c.starts_at > NOW() THEN 'upcoming'
    WHEN c.ends_at < NOW() THEN 'ended'
    ELSE 'live'
  END as live_status,
  EXTRACT(EPOCH FROM (c.ends_at - NOW())) as seconds_remaining
FROM competitions c
WHERE c.status IN ('upcoming', 'active')
ORDER BY c.starts_at ASC;

-- =============================================
-- INSERT: Seed recurring competitions
-- =============================================
-- Daily 24h Flip (runs every day)
INSERT INTO competitions (name, description, type, starts_at, ends_at, prizes)
VALUES (
  '24-Hour Flip Challenge',
  'Find the best performing token in 24 hours. Highest total return wins!',
  'daily_flip',
  DATE_TRUNC('day', NOW() + INTERVAL '1 day') + INTERVAL '8 hours', -- Tomorrow 8am UTC
  DATE_TRUNC('day', NOW() + INTERVAL '2 days') + INTERVAL '8 hours', -- Day after 8am UTC
  '{"1st": "daily_champion", "2nd": "silver_trophy", "3rd": "bronze_trophy"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Weekly Competition
INSERT INTO competitions (name, description, type, starts_at, ends_at, min_participants, prizes)
VALUES (
  'Weekly Formula Showdown',
  'A week-long battle of formulas. Consistency is key - accumulate the best returns over 7 days.',
  'weekly',
  DATE_TRUNC('week', NOW() + INTERVAL '1 week') + INTERVAL '8 hours', -- Next Monday 8am UTC
  DATE_TRUNC('week', NOW() + INTERVAL '2 weeks') + INTERVAL '8 hours', -- Following Monday 8am UTC
  5,
  '{"1st": "weekly_champion", "2nd": "silver_trophy", "3rd": "bronze_trophy"}'::jsonb
) ON CONFLICT DO NOTHING;
