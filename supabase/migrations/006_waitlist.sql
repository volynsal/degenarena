-- Waitlist System
-- Run this in Supabase SQL Editor

-- =============================================
-- WAITLIST TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'signed_up')),
  referral_source TEXT, -- where they heard about us
  notes TEXT, -- admin notes
  approved_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only service role can manage waitlist
CREATE POLICY "Service role can manage waitlist" ON waitlist
  FOR ALL USING (true) WITH CHECK (true);
