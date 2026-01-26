-- Single-Use Clan Invite Codes
-- Run this in Supabase SQL Editor after previous migrations

-- =============================================
-- CLAN INVITES TABLE (single-use codes)
-- =============================================
CREATE TABLE IF NOT EXISTS clan_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clan_id UUID NOT NULL REFERENCES clans(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  used_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Track status
  is_used BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clan_invites_code ON clan_invites(code);
CREATE INDEX IF NOT EXISTS idx_clan_invites_clan ON clan_invites(clan_id);
CREATE INDEX IF NOT EXISTS idx_clan_invites_created_by ON clan_invites(created_by);

-- Enable RLS
ALTER TABLE clan_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view their clan's invites" ON clan_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = clan_invites.clan_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create invites" ON clan_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = clan_invites.clan_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete invites" ON clan_invites
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = clan_invites.clan_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

-- Remove the old invite_code column from clans (no longer needed)
ALTER TABLE clans DROP COLUMN IF EXISTS invite_code;

-- Make all clans private by default (remove public option)
ALTER TABLE clans ALTER COLUMN is_public SET DEFAULT FALSE;

-- Update existing clans to be private
UPDATE clans SET is_public = FALSE WHERE is_public = TRUE;
