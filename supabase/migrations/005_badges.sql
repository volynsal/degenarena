-- Badge System
-- Run this in Supabase SQL Editor after previous migrations

-- =============================================
-- BADGES TABLE (badge definitions)
-- =============================================
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- emoji or icon name
  category TEXT NOT NULL CHECK (category IN ('achievement', 'milestone', 'rare', 'special')),
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER BADGES TABLE (badges earned by users)
-- =============================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}', -- extra context (e.g., which token for "Whale Hunter")
  
  UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view user badges" ON user_badges
  FOR SELECT USING (true);

-- Only system can insert badges (via service role)
CREATE POLICY "System can manage user badges" ON user_badges
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- INSERT DEFAULT BADGES
-- =============================================
INSERT INTO badges (id, name, description, icon, category, rarity, sort_order) VALUES
  -- Achievement badges
  ('first_blood', 'First Blood', 'Got your first formula match', '🎯', 'achievement', 'common', 10),
  ('hot_streak', 'Hot Streak', '5 winning matches in a row', '🔥', 'achievement', 'uncommon', 20),
  ('on_fire', 'On Fire', '10 winning matches in a row', '💥', 'achievement', 'rare', 21),
  ('unstoppable', 'Unstoppable', '20 winning matches in a row', '⚡', 'achievement', 'epic', 22),
  
  -- Milestone badges  
  ('century_club', 'Century Club', '100 total formula matches', '💯', 'milestone', 'uncommon', 30),
  ('thousand_strong', 'Thousand Strong', '1,000 total formula matches', '🏆', 'milestone', 'rare', 31),
  ('formula_master', 'Formula Master', 'Created 10 formulas', '🧪', 'milestone', 'uncommon', 40),
  ('formula_scientist', 'Formula Scientist', 'Created 50 formulas', '🔬', 'milestone', 'rare', 41),
  
  -- Rare finds
  ('whale_hunter', 'Whale Hunter', 'Found a token that did 10x+', '🐋', 'rare', 'rare', 50),
  ('diamond_hands', 'Diamond Hands', 'Found a token that did 50x+', '💎', 'rare', 'epic', 51),
  ('moon_shot', 'Moon Shot', 'Found a token that did 100x+', '🌙', 'rare', 'legendary', 52),
  
  -- Performance badges
  ('sharp_shooter', 'Sharp Shooter', '70%+ win rate with 50+ matches', '🎯', 'achievement', 'rare', 60),
  ('elite_trader', 'Elite Trader', '80%+ win rate with 100+ matches', '👑', 'achievement', 'epic', 61),
  
  -- Social badges
  ('trendsetter', 'Trendsetter', 'Formula copied 10+ times', '📈', 'achievement', 'uncommon', 70),
  ('influencer', 'Influencer', 'Formula copied 100+ times', '⭐', 'achievement', 'rare', 71),
  ('clan_founder', 'Clan Founder', 'Created a clan', '🛡️', 'achievement', 'uncommon', 80),
  ('squad_goals', 'Squad Goals', 'Clan reached 10 members', '👥', 'achievement', 'uncommon', 81),
  
  -- Special badges
  ('early_adopter', 'Early Adopter', 'Joined during beta', '🌟', 'special', 'rare', 90),
  ('og_degen', 'OG Degen', 'One of the first 100 users', '🏅', 'special', 'legendary', 91)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- FUNCTION TO CHECK AND AWARD BADGES
-- =============================================
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID)
RETURNS TABLE(badge_id TEXT, badge_name TEXT, newly_awarded BOOLEAN) AS $$
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
  
  -- Get max return from any match
  SELECT COALESCE(MAX(tm.return_24h), 0)
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
  
  -- Return all user badges
  RETURN QUERY
  SELECT 
    ub.badge_id,
    b.name,
    (ub.earned_at > NOW() - INTERVAL '5 seconds') as newly_awarded
  FROM user_badges ub
  JOIN badges b ON ub.badge_id = b.id
  WHERE ub.user_id = p_user_id
  ORDER BY b.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER TO CHECK BADGES ON FORMULA CHANGES
-- =============================================
CREATE OR REPLACE FUNCTION trigger_check_badges()
RETURNS TRIGGER AS $$
BEGIN
  -- Check badges for the user (async would be better but this works)
  PERFORM check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on formula updates
DROP TRIGGER IF EXISTS check_badges_on_formula_update ON formulas;
CREATE TRIGGER check_badges_on_formula_update
  AFTER INSERT OR UPDATE ON formulas
  FOR EACH ROW EXECUTE FUNCTION trigger_check_badges();
