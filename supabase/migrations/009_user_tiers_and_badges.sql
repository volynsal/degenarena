-- User Subscription Tiers and Achievement Badges
-- Adds tier system and badge tracking to profiles

-- Add subscription tier to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'elite'));

-- Add badges as JSONB array (flexible for future badges)
-- Format: [{ "id": "first_formula", "earned_at": "2024-01-01T00:00:00Z" }, ...]
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;

-- Add bio field for user description
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Index for querying users by tier (useful for admin/analytics)
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);

-- Comment explaining badge structure
COMMENT ON COLUMN profiles.badges IS 'Array of earned badges: [{ "id": "badge_id", "earned_at": "ISO timestamp" }]';
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription level: free, pro, or elite';

-- Set hypesaint777 (volynsal@gmail.com) to elite tier
-- Run this after migration to upgrade the account
-- UPDATE profiles SET subscription_tier = 'elite' WHERE email = 'volynsal@gmail.com';
