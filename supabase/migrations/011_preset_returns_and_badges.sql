-- Migration 011: Preset tracking, max price returns, and badge fixes
-- Run this in Supabase SQL Editor

-- =============================================
-- ADD PRESET TRACKING TO FORMULAS
-- =============================================
ALTER TABLE formulas 
ADD COLUMN IF NOT EXISTS preset_id TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS exit_hours NUMERIC DEFAULT NULL; -- Recommended exit window in hours

COMMENT ON COLUMN formulas.preset_id IS 'ID of the preset used to create this formula (null if custom)';
COMMENT ON COLUMN formulas.exit_hours IS 'Recommended exit window in hours (from preset or custom)';

-- =============================================
-- ADD MAX PRICE TRACKING TO TOKEN_MATCHES
-- =============================================
ALTER TABLE token_matches
ADD COLUMN IF NOT EXISTS price_high_24h NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_high_exit NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_max_24h NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_max_exit NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_price_check TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN token_matches.price_high_24h IS 'Highest price seen in first 24 hours after match';
COMMENT ON COLUMN token_matches.price_high_exit IS 'Highest price seen during recommended exit window';
COMMENT ON COLUMN token_matches.return_max_24h IS 'Return based on 24h high: (high - entry) / entry * 100';
COMMENT ON COLUMN token_matches.return_max_exit IS 'Return based on exit window high: (high - entry) / entry * 100';

-- =============================================
-- PREVENT PRESET FORMULAS FROM BEING PUBLIC
-- =============================================
CREATE OR REPLACE FUNCTION prevent_preset_public()
RETURNS TRIGGER AS $$
BEGIN
  -- If formula is based on a preset, it cannot be made public
  IF NEW.preset_id IS NOT NULL AND NEW.is_public = true THEN
    NEW.is_public := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_preset_private ON formulas;
CREATE TRIGGER enforce_preset_private
  BEFORE INSERT OR UPDATE ON formulas
  FOR EACH ROW EXECUTE FUNCTION prevent_preset_public();

-- =============================================
-- FIX BADGE CHECK FUNCTION (resolve ambiguous column)
-- =============================================
-- Must drop first because return type changed
DROP FUNCTION IF EXISTS check_and_award_badges(UUID);

CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS TABLE(awarded_badge_id TEXT, awarded_badge_name TEXT, newly_awarded BOOLEAN) AS $$
DECLARE
  v_total_matches INTEGER;
  v_total_wins INTEGER;
  v_total_formulas INTEGER;
  v_max_return NUMERIC;
  v_win_rate NUMERIC;
  v_copy_count INTEGER;
  v_streak INTEGER;
  v_has_clan BOOLEAN;
  v_clan_members INTEGER;
BEGIN
  -- Get user stats
  SELECT 
    COALESCE(SUM(f.total_matches), 0),
    COALESCE(SUM(CASE WHEN f.win_rate > 0 THEN ROUND(f.total_matches * f.win_rate / 100) ELSE 0 END), 0),
    COUNT(*)
  INTO v_total_matches, v_total_wins, v_total_formulas
  FROM formulas f
  WHERE f.user_id = p_user_id;
  
  -- Calculate overall win rate
  IF v_total_matches > 0 THEN
    v_win_rate := (v_total_wins::NUMERIC / v_total_matches) * 100;
  ELSE
    v_win_rate := 0;
  END IF;
  
  -- Get max return from any match (use the new max return if available)
  SELECT COALESCE(MAX(GREATEST(COALESCE(tm.return_max_24h, 0), COALESCE(tm.return_24h, 0))), 0)
  INTO v_max_return
  FROM token_matches tm
  JOIN formulas f ON tm.formula_id = f.id
  WHERE f.user_id = p_user_id;
  
  -- Get total copies of user's formulas
  SELECT COALESCE(SUM(f.copy_count), 0)
  INTO v_copy_count
  FROM formulas f
  WHERE f.user_id = p_user_id;
  
  -- Check clan status
  SELECT EXISTS(
    SELECT 1 FROM clans WHERE owner_id = p_user_id
  ) INTO v_has_clan;
  
  SELECT COALESCE(c.member_count, 0)
  INTO v_clan_members
  FROM clan_members cm
  JOIN clans c ON cm.clan_id = c.id
  WHERE cm.user_id = p_user_id AND cm.role = 'owner';
  
  -- Award badges based on conditions
  -- First Blood
  IF v_total_matches >= 1 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'first_blood')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Century Club
  IF v_total_matches >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'century_club')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Thousand Strong
  IF v_total_matches >= 1000 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'thousand_strong')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Formula Master
  IF v_total_formulas >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'formula_master')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Formula Scientist
  IF v_total_formulas >= 50 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'formula_scientist')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Whale Hunter (10x = 900% return)
  IF v_max_return >= 900 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'whale_hunter')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Diamond Hands (50x = 4900% return)
  IF v_max_return >= 4900 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'diamond_hands')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Moon Shot (100x = 9900% return)
  IF v_max_return >= 9900 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'moon_shot')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Sharp Shooter
  IF v_win_rate >= 70 AND v_total_matches >= 50 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'sharp_shooter')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Elite Trader
  IF v_win_rate >= 80 AND v_total_matches >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'elite_trader')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Trendsetter
  IF v_copy_count >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'trendsetter')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Influencer
  IF v_copy_count >= 100 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'influencer')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Clan Founder
  IF v_has_clan THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'clan_founder')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Squad Goals
  IF v_clan_members >= 10 THEN
    INSERT INTO user_badges (user_id, badge_id)
    VALUES (p_user_id, 'squad_goals')
    ON CONFLICT (user_id, badge_id) DO NOTHING;
  END IF;
  
  -- Return all user badges (using aliased column names to avoid ambiguity)
  RETURN QUERY
  SELECT 
    ub.badge_id AS awarded_badge_id,
    b.name AS awarded_badge_name,
    (ub.earned_at > NOW() - INTERVAL '5 seconds') AS newly_awarded
  FROM user_badges ub
  JOIN badges b ON ub.badge_id = b.id
  WHERE ub.user_id = p_user_id
  ORDER BY b.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RE-CREATE BADGE TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_badges_on_formula_update ON formulas;
CREATE TRIGGER check_badges_on_formula_update
  AFTER INSERT OR UPDATE ON formulas
  FOR EACH ROW EXECUTE FUNCTION trigger_check_badges();

-- =============================================
-- UPDATE AVG_RETURN CALCULATION FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION calculate_formula_avg_return(p_formula_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_preset_id TEXT;
  v_avg_return NUMERIC;
BEGIN
  -- Check if formula is a preset
  SELECT preset_id INTO v_preset_id FROM formulas WHERE id = p_formula_id;
  
  IF v_preset_id IS NOT NULL THEN
    -- Preset formula: use max exit return (return during exit window)
    SELECT COALESCE(AVG(COALESCE(return_max_exit, return_max_24h, return_24h)), 0)
    INTO v_avg_return
    FROM token_matches
    WHERE formula_id = p_formula_id
    AND (return_max_exit IS NOT NULL OR return_max_24h IS NOT NULL OR return_24h IS NOT NULL);
  ELSE
    -- Non-preset formula: use max 24h return
    SELECT COALESCE(AVG(COALESCE(return_max_24h, return_24h)), 0)
    INTO v_avg_return
    FROM token_matches
    WHERE formula_id = p_formula_id
    AND (return_max_24h IS NOT NULL OR return_24h IS NOT NULL);
  END IF;
  
  RETURN ROUND(v_avg_return, 2);
END;
$$ LANGUAGE plpgsql;
