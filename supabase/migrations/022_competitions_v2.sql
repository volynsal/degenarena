-- 022: Competitions V2 - Verified PnL, XP/Tier System
-- Replaces passive formula-based competitions with verified wallet PnL competitions.
-- Adds XP/prestige tier system earned from all app activity.

-- =============================================
-- 1. XP & TIER SYSTEM
-- =============================================

-- User XP - tracks total XP and cached tier
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'rookie' CHECK (tier IN ('rookie', 'contender', 'veteran', 'champion', 'legend')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own xp" ON user_xp
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read all xp for leaderboards" ON user_xp
  FOR SELECT USING (TRUE);

-- XP Events - audit trail of all XP awards
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN (
    'arena_win', 'arena_streak', 'comp_placement',
    'go_live', 'pnl_milestone', 'badge_earned'
  )),
  amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_events_created ON xp_events(created_at DESC);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own xp events" ON xp_events
  FOR SELECT USING (auth.uid() = user_id);

-- Function: Award XP and recalculate tier atomically
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_total INTEGER;
  v_new_tier TEXT;
BEGIN
  -- Ensure user_xp row exists
  INSERT INTO user_xp (user_id, total_xp, tier)
  VALUES (p_user_id, 0, 'rookie')
  ON CONFLICT (user_id) DO NOTHING;

  -- Award XP atomically
  UPDATE user_xp SET
    total_xp = COALESCE(total_xp, 0) + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING total_xp INTO v_new_total;

  -- Calculate new tier
  v_new_tier := CASE
    WHEN v_new_total >= 5000 THEN 'legend'
    WHEN v_new_total >= 2000 THEN 'champion'
    WHEN v_new_total >= 500 THEN 'veteran'
    WHEN v_new_total >= 100 THEN 'contender'
    ELSE 'rookie'
  END;

  -- Update tier if changed
  UPDATE user_xp SET tier = v_new_tier WHERE user_id = p_user_id AND tier != v_new_tier;

  -- Record XP event
  INSERT INTO xp_events (user_id, source, amount, metadata)
  VALUES (p_user_id, p_source, p_amount, p_metadata);

  RETURN jsonb_build_object(
    'total_xp', v_new_total,
    'tier', v_new_tier,
    'awarded', p_amount
  );
END;
$$;

-- =============================================
-- 2. UPDATE COMPETITIONS TABLE
-- =============================================

-- Update type constraint to new competition types
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_type_check;
ALTER TABLE competitions ADD CONSTRAINT competitions_type_check
  CHECK (type IN ('daily_flip', 'best_call', 'live_trading', 'clan_war', 'survivor',
                  'weekly', 'head_to_head'));

-- Add tier requirement (nullable = open to all tiers)
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS tier_requirement TEXT
  CHECK (tier_requirement IS NULL OR tier_requirement IN ('rookie', 'contender', 'veteran', 'champion', 'legend'));

-- Survivor support
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS round_count INTEGER DEFAULT 1;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS current_round INTEGER DEFAULT 0;

-- Point prizes in main GalaxyArena balance
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS point_prizes JSONB DEFAULT '{"1st": 500, "2nd": 250, "3rd": 100}'::jsonb;

-- =============================================
-- 3. UPDATE COMPETITION ENTRIES TABLE
-- =============================================

-- Make formula_id optional (no longer required for PnL-based competitions)
ALTER TABLE competition_entries ALTER COLUMN formula_id DROP NOT NULL;

-- PnL tracking columns
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS pnl_snapshot_start NUMERIC DEFAULT 0;
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS pnl_snapshot_end NUMERIC;
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS pnl_delta NUMERIC DEFAULT 0;
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS best_trade_return NUMERIC;

-- Survivor elimination tracking
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS eliminated_round INTEGER;

-- User tier at entry time (for display)
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS user_tier TEXT;

-- Drop the old unique constraint that requires formula_id
ALTER TABLE competition_entries DROP CONSTRAINT IF EXISTS competition_entries_competition_id_user_id_formula_id_key;

-- Add new unique constraint (one entry per user per competition)
-- Use a partial index approach to handle the migration safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_competition_entries_unique_user'
  ) THEN
    CREATE UNIQUE INDEX idx_competition_entries_unique_user
      ON competition_entries(competition_id, user_id)
      WHERE status = 'active';
  END IF;
END
$$;

-- =============================================
-- 4. UPDATE FINALIZE FUNCTION
-- =============================================

-- Replace the old formula-based finalize with PnL-based ranking
CREATE OR REPLACE FUNCTION finalize_competition(p_competition_id UUID)
RETURNS void AS $$
DECLARE
  v_entry RECORD;
  v_rank INTEGER := 0;
  v_prizes JSONB;
  v_point_prizes JSONB;
  v_comp_type TEXT;
BEGIN
  -- Get competition info
  SELECT prizes, point_prizes, type INTO v_prizes, v_point_prizes, v_comp_type
  FROM competitions WHERE id = p_competition_id;

  -- Determine sort column based on type
  -- best_call: rank by best_trade_return
  -- everything else: rank by pnl_delta (total PnL)
  IF v_comp_type = 'best_call' THEN
    FOR v_entry IN
      SELECT id, user_id
      FROM competition_entries
      WHERE competition_id = p_competition_id
        AND status = 'active'
      ORDER BY COALESCE(best_trade_return, 0) DESC, COALESCE(pnl_delta, 0) DESC
    LOOP
      v_rank := v_rank + 1;
      UPDATE competition_entries SET
        final_rank = v_rank,
        prize_awarded = CASE
          WHEN v_rank = 1 THEN v_prizes->>'1st'
          WHEN v_rank = 2 THEN v_prizes->>'2nd'
          WHEN v_rank = 3 THEN v_prizes->>'3rd'
          ELSE NULL
        END
      WHERE id = v_entry.id;

      -- Award point prizes to top 3
      IF v_rank <= 3 AND v_point_prizes IS NOT NULL THEN
        DECLARE
          v_prize_key TEXT := CASE v_rank WHEN 1 THEN '1st' WHEN 2 THEN '2nd' WHEN 3 THEN '3rd' END;
          v_prize_amount INTEGER := COALESCE((v_point_prizes->>v_prize_key)::INTEGER, 0);
        BEGIN
          IF v_prize_amount > 0 THEN
            -- Award GalaxyArena points
            PERFORM credit_arena_points(v_entry.user_id, v_prize_amount, false);
            -- Award XP
            PERFORM award_xp(
              v_entry.user_id,
              CASE v_rank WHEN 1 THEN 50 WHEN 2 THEN 30 WHEN 3 THEN 15 ELSE 0 END,
              'comp_placement',
              jsonb_build_object('competition_id', p_competition_id, 'rank', v_rank)
            );
          END IF;
        END;
      END IF;
    END LOOP;
  ELSE
    FOR v_entry IN
      SELECT id, user_id
      FROM competition_entries
      WHERE competition_id = p_competition_id
        AND status = 'active'
      ORDER BY COALESCE(pnl_delta, 0) DESC, COALESCE(best_trade_return, 0) DESC
    LOOP
      v_rank := v_rank + 1;
      UPDATE competition_entries SET
        final_rank = v_rank,
        prize_awarded = CASE
          WHEN v_rank = 1 THEN v_prizes->>'1st'
          WHEN v_rank = 2 THEN v_prizes->>'2nd'
          WHEN v_rank = 3 THEN v_prizes->>'3rd'
          ELSE NULL
        END
      WHERE id = v_entry.id;

      -- Award point prizes to top 3
      IF v_rank <= 3 AND v_point_prizes IS NOT NULL THEN
        DECLARE
          v_prize_key TEXT := CASE v_rank WHEN 1 THEN '1st' WHEN 2 THEN '2nd' WHEN 3 THEN '3rd' END;
          v_prize_amount INTEGER := COALESCE((v_point_prizes->>v_prize_key)::INTEGER, 0);
        BEGIN
          IF v_prize_amount > 0 THEN
            PERFORM credit_arena_points(v_entry.user_id, v_prize_amount, false);
            PERFORM award_xp(
              v_entry.user_id,
              CASE v_rank WHEN 1 THEN 50 WHEN 2 THEN 30 WHEN 3 THEN 15 ELSE 0 END,
              'comp_placement',
              jsonb_build_object('competition_id', p_competition_id, 'rank', v_rank)
            );
          END IF;
        END;
      END IF;
    END LOOP;
  END IF;

  -- Mark competition as completed
  UPDATE competitions
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_competition_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_user_xp_tier ON user_xp(tier);
CREATE INDEX IF NOT EXISTS idx_user_xp_total ON user_xp(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_competition_entries_pnl ON competition_entries(pnl_delta DESC);
