-- Add Twitch URL to profiles for streaming integration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitch_url TEXT;

-- Add index for potential future queries on streaming users
CREATE INDEX IF NOT EXISTS idx_profiles_twitch_url ON profiles(twitch_url) WHERE twitch_url IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN profiles.twitch_url IS 'User Twitch channel URL for streaming integration';
