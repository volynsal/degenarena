-- Migration 014: Fix Return Calculations
-- The avg_return was showing 0% because it was using return_24h (only set after 24h)
-- Now uses return_max_24h/return_max_exit for real-time tracking
-- Also sets is_win based on whether return is positive

-- =============================================
-- UPDATE FORMULA STATS FUNCTION
-- Now uses max returns instead of point-in-time snapshots
-- =============================================
CREATE OR REPLACE FUNCTION update_formula_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_total_matches INTEGER;
  v_wins INTEGER;
  v_win_rate NUMERIC;
  v_avg_return NUMERIC;
  v_formula_preset_id TEXT;
BEGIN
  -- Check if this formula is a preset (to determine which return to use)
  SELECT preset_id INTO v_formula_preset_id
  FROM formulas 
  WHERE id = COALESCE(NEW.formula_id, OLD.formula_id);
  
  -- Calculate stats from token_matches
  -- Use return_max_exit for presets, return_max_24h for non-presets
  -- Fall back to return_24h/return_1h if max returns not yet calculated
  IF v_formula_preset_id IS NOT NULL THEN
    -- Preset formula: use exit window return
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE COALESCE(return_max_exit, return_max_24h, return_24h, return_1h, 0) > 0),
      COALESCE(AVG(COALESCE(return_max_exit, return_max_24h, return_24h, return_1h)), 0)
    INTO v_total_matches, v_wins, v_avg_return
    FROM token_matches
    WHERE formula_id = COALESCE(NEW.formula_id, OLD.formula_id);
  ELSE
    -- Non-preset formula: use 24h max return
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE COALESCE(return_max_24h, return_24h, return_1h, 0) > 0),
      COALESCE(AVG(COALESCE(return_max_24h, return_24h, return_1h)), 0)
    INTO v_total_matches, v_wins, v_avg_return
    FROM token_matches
    WHERE formula_id = COALESCE(NEW.formula_id, OLD.formula_id);
  END IF;
  
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

-- =============================================
-- UPDATE TRIGGER TO FIRE ON MORE FIELDS
-- =============================================
DROP TRIGGER IF EXISTS update_formula_stats_trigger ON token_matches;
CREATE TRIGGER update_formula_stats_trigger
  AFTER INSERT OR UPDATE OF is_win, return_24h, return_1h, return_max_24h, return_max_exit ON token_matches
  FOR EACH ROW EXECUTE FUNCTION update_formula_stats();

-- =============================================
-- FUNCTION TO UPDATE IS_WIN BASED ON RETURNS
-- =============================================
CREATE OR REPLACE FUNCTION update_match_win_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Set is_win based on whether return is positive
  -- Use max returns first, fall back to point-in-time returns
  IF NEW.return_max_24h IS NOT NULL OR NEW.return_max_exit IS NOT NULL OR NEW.return_24h IS NOT NULL OR NEW.return_1h IS NOT NULL THEN
    NEW.is_win := COALESCE(NEW.return_max_exit, NEW.return_max_24h, NEW.return_24h, NEW.return_1h, 0) > 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_match_win_status_trigger ON token_matches;
CREATE TRIGGER update_match_win_status_trigger
  BEFORE UPDATE OF return_max_24h, return_max_exit, return_24h, return_1h ON token_matches
  FOR EACH ROW EXECUTE FUNCTION update_match_win_status();

-- =============================================
-- RECALCULATE ALL EXISTING MATCHES
-- Set is_win for matches that have returns but no is_win set
-- =============================================
UPDATE token_matches
SET is_win = COALESCE(return_max_exit, return_max_24h, return_24h, return_1h, 0) > 0
WHERE (return_max_24h IS NOT NULL OR return_max_exit IS NOT NULL OR return_24h IS NOT NULL OR return_1h IS NOT NULL)
  AND is_win IS NULL;

-- =============================================
-- RECALCULATE ALL FORMULA STATS
-- =============================================
UPDATE formulas f
SET 
  wins = sub.wins,
  win_rate = sub.win_rate,
  avg_return = sub.avg_return,
  updated_at = NOW()
FROM (
  SELECT 
    tm.formula_id,
    COUNT(*) FILTER (WHERE COALESCE(tm.return_max_exit, tm.return_max_24h, tm.return_24h, tm.return_1h, 0) > 0) as wins,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE COALESCE(tm.return_max_exit, tm.return_max_24h, tm.return_24h, tm.return_1h, 0) > 0)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0 
    END as win_rate,
    ROUND(COALESCE(AVG(COALESCE(tm.return_max_exit, tm.return_max_24h, tm.return_24h, tm.return_1h)), 0), 2) as avg_return
  FROM token_matches tm
  GROUP BY tm.formula_id
) sub
WHERE f.id = sub.formula_id;
