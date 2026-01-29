-- Migration 013: RugCheck Integration
-- Add safety check parameters to formulas
-- Run this in Supabase SQL Editor

-- =============================================
-- ADD RUGCHECK FIELDS TO FORMULAS
-- =============================================
ALTER TABLE formulas
ADD COLUMN IF NOT EXISTS require_rugcheck BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rugcheck_min_score INTEGER DEFAULT 50;

COMMENT ON COLUMN formulas.require_rugcheck IS 'Whether to check RugCheck.xyz before confirming match';
COMMENT ON COLUMN formulas.rugcheck_min_score IS 'Minimum RugCheck score required (0-100, higher = safer)';

-- =============================================
-- ADD RUGCHECK DATA TO TOKEN_MATCHES
-- =============================================
ALTER TABLE token_matches
ADD COLUMN IF NOT EXISTS rugcheck_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rugcheck_risks TEXT[] DEFAULT NULL;

COMMENT ON COLUMN token_matches.rugcheck_score IS 'RugCheck.xyz safety score at match time';
COMMENT ON COLUMN token_matches.rugcheck_risks IS 'Array of danger-level risks identified';

-- =============================================
-- SET RUGCHECK ENABLED FOR EXISTING PRESET FORMULAS
-- =============================================
UPDATE formulas
SET require_rugcheck = TRUE, rugcheck_min_score = 50
WHERE preset_id IS NOT NULL;
