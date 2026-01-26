-- User Profiles & Clans
-- Run this in Supabase SQL Editor after previous migrations

-- =============================================
-- ENHANCE PROFILES TABLE
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- =============================================
-- USER FOLLOWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Can't follow yourself, each follow is unique
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view follows" ON user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
    UPDATE profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follow counts
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON user_follows;
CREATE TRIGGER update_follow_counts_trigger
  AFTER INSERT OR DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- =============================================
-- CLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS clans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Settings
  is_public BOOLEAN DEFAULT TRUE,
  max_members INTEGER DEFAULT 50,
  invite_code TEXT UNIQUE,
  
  -- Stats (denormalized)
  member_count INTEGER DEFAULT 1,
  total_matches INTEGER DEFAULT 0,
  avg_win_rate NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clans_slug ON clans(slug);
CREATE INDEX IF NOT EXISTS idx_clans_owner ON clans(owner_id);
CREATE INDEX IF NOT EXISTS idx_clans_avg_win_rate ON clans(avg_win_rate DESC);

-- Enable RLS
ALTER TABLE clans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clans
CREATE POLICY "Anyone can view public clans" ON clans
  FOR SELECT USING (is_public = TRUE OR owner_id = auth.uid());

CREATE POLICY "Users can create clans" ON clans
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their clan" ON clans
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their clan" ON clans
  FOR DELETE USING (auth.uid() = owner_id);

-- =============================================
-- CLAN MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS clan_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can only be in one clan
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clan_members_clan ON clan_members(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_members_user ON clan_members(user_id);

-- Enable RLS
ALTER TABLE clan_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clan_members
CREATE POLICY "Anyone can view clan members" ON clan_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join clans" ON clan_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave clans" ON clan_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = clan_members.clan_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update member roles" ON clan_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = clan_members.clan_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Function to update clan member count
CREATE OR REPLACE FUNCTION update_clan_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE clans SET member_count = member_count + 1 WHERE id = NEW.clan_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE clans SET member_count = member_count - 1 WHERE id = OLD.clan_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for member count
DROP TRIGGER IF EXISTS update_clan_member_count_trigger ON clan_members;
CREATE TRIGGER update_clan_member_count_trigger
  AFTER INSERT OR DELETE ON clan_members
  FOR EACH ROW EXECUTE FUNCTION update_clan_member_count();

-- Function to update clan stats (called periodically or on demand)
CREATE OR REPLACE FUNCTION update_clan_stats(clan_uuid UUID)
RETURNS VOID AS $$
DECLARE
  v_total_matches INTEGER;
  v_avg_win_rate NUMERIC;
BEGIN
  SELECT 
    COALESCE(SUM(f.total_matches), 0),
    COALESCE(AVG(f.win_rate), 0)
  INTO v_total_matches, v_avg_win_rate
  FROM formulas f
  JOIN clan_members cm ON f.user_id = cm.user_id
  WHERE cm.clan_id = clan_uuid;
  
  UPDATE clans
  SET 
    total_matches = v_total_matches,
    avg_win_rate = ROUND(v_avg_win_rate, 2),
    updated_at = NOW()
  WHERE id = clan_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CLAN LEADERBOARD VIEW
-- =============================================
CREATE OR REPLACE VIEW clan_leaderboard AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY c.avg_win_rate DESC, c.total_matches DESC) as rank,
  c.id as clan_id,
  c.name,
  c.slug,
  c.logo_url,
  c.member_count,
  c.total_matches,
  c.avg_win_rate,
  c.owner_id,
  p.username as owner_username
FROM clans c
JOIN profiles p ON c.owner_id = p.id
WHERE c.is_public = TRUE
  AND c.member_count >= 3  -- Minimum members for ranking
ORDER BY c.avg_win_rate DESC, c.total_matches DESC;

-- Add clan_id to profiles for easy lookup
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clan_id UUID REFERENCES clans(id) ON DELETE SET NULL;

-- Function to sync profile clan_id with clan_members
CREATE OR REPLACE FUNCTION sync_profile_clan()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET clan_id = NEW.clan_id WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET clan_id = NULL WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_profile_clan_trigger ON clan_members;
CREATE TRIGGER sync_profile_clan_trigger
  AFTER INSERT OR DELETE ON clan_members
  FOR EACH ROW EXECUTE FUNCTION sync_profile_clan();
