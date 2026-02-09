-- =============================================
-- Migration 024: Live Session Tracking
-- Tracks when users stream on Twitch for Live Trading Challenges
-- =============================================

-- ── 1. Live sessions table ──
-- Each row = one continuous streaming session
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  twitch_username TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,           -- NULL while still live
  duration_minutes INTEGER DEFAULT 0,
  -- Optional: link to a competition this session counts toward
  competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_live_sessions_user ON live_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_active ON live_sessions(user_id, ended_at) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_live_sessions_competition ON live_sessions(competition_id) WHERE competition_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_live_sessions_started ON live_sessions(started_at DESC);

-- ── 2. Add live_minutes to competition_entries ──
-- Tracks total minutes streamed during a competition
ALTER TABLE competition_entries ADD COLUMN IF NOT EXISTS live_minutes INTEGER DEFAULT 0;

-- ── 3. RLS policies ──
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

-- Users can see their own sessions
CREATE POLICY "Users can view own live sessions"
  ON live_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role handles inserts/updates (cron job)
CREATE POLICY "Service role manages live sessions"
  ON live_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 4. Helper function: get total live minutes for a user in a time range ──
CREATE OR REPLACE FUNCTION get_live_minutes(
  p_user_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
) RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(
    EXTRACT(EPOCH FROM (
      LEAST(COALESCE(ended_at, NOW()), p_end) - GREATEST(started_at, p_start)
    )) / 60
  ), 0)::INTEGER
  INTO total
  FROM live_sessions
  WHERE user_id = p_user_id
    AND started_at < p_end
    AND (ended_at IS NULL OR ended_at > p_start);

  RETURN GREATEST(total, 0);
END;
$$;

-- ── 5. Update finalize_competition to handle live_trading ──
-- For live_trading: only rank users with 30+ live minutes, rank by PnL delta
CREATE OR REPLACE FUNCTION finalize_competition(p_competition_id UUID)
RETURNS void AS $$
DECLARE
  v_entry RECORD;
  v_rank INTEGER := 0;
  v_prizes JSONB;
  v_point_prizes JSONB;
  v_comp_type TEXT;
  v_comp_start TIMESTAMPTZ;
  v_comp_end TIMESTAMPTZ;
  v_live_mins INTEGER;
BEGIN
  -- Get competition info
  SELECT prizes, point_prizes, type, starts_at, ends_at
  INTO v_prizes, v_point_prizes, v_comp_type, v_comp_start, v_comp_end
  FROM competitions WHERE id = p_competition_id;

  -- For live_trading: update live_minutes on entries before ranking
  IF v_comp_type = 'live_trading' THEN
    -- Update live_minutes for all entries
    FOR v_entry IN
      SELECT id, user_id
      FROM competition_entries
      WHERE competition_id = p_competition_id AND status = 'active'
    LOOP
      v_live_mins := get_live_minutes(v_entry.user_id, v_comp_start, v_comp_end);
      UPDATE competition_entries SET live_minutes = v_live_mins WHERE id = v_entry.id;

      -- Disqualify users with less than 30 minutes live
      IF v_live_mins < 30 THEN
        UPDATE competition_entries SET status = 'disqualified' WHERE id = v_entry.id;
      END IF;
    END LOOP;
  END IF;

  -- Rank entries based on competition type
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
  ELSE
    -- live_trading and daily_flip both rank by pnl_delta
    -- (disqualified entries already filtered out by status = 'active')
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
