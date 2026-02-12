-- 026: Admin role for platform management
-- Adds is_admin flag to profiles for admin-only features (market fixes, moderation, etc.)

-- Add admin column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set founder as admin
UPDATE profiles SET is_admin = TRUE WHERE email = 'volynsal@gmail.com';

-- Allow users to read their own is_admin status
-- (Service role already bypasses RLS for all operations)
