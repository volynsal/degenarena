-- Migration 015: LunarCrush Galaxy Score Integration
-- Adds social momentum tracking via Galaxy Score
-- Run this in Supabase SQL Editor

-- =============================================
-- ADD GALAXY SCORE FIELDS TO FORMULAS
-- =============================================
ALTER TABLE formulas
ADD COLUMN IF NOT EXISTS require_galaxy_score BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS galaxy_score_min INTEGER DEFAULT 50;

COMMENT ON COLUMN formulas.require_galaxy_score IS 'Whether to check LunarCrush Galaxy Score before confirming match';
COMMENT ON COLUMN formulas.galaxy_score_min IS 'Minimum Galaxy Score required (0-100, higher = stronger social momentum)';

-- =============================================
-- ADD GALAXY SCORE DATA TO TOKEN_MATCHES
-- =============================================
ALTER TABLE token_matches
ADD COLUMN IF NOT EXISTS galaxy_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS galaxy_score_change_24h NUMERIC DEFAULT NULL;

COMMENT ON COLUMN token_matches.galaxy_score IS 'LunarCrush Galaxy Score at match time (0-100)';
COMMENT ON COLUMN token_matches.galaxy_score_change_24h IS '24-hour change in Galaxy Score';

-- =============================================
-- SET GALAXY SCORE FOR RELEVANT PRESETS
-- =============================================
-- Momentum Breakout: Social confirms momentum
UPDATE formulas 
SET require_galaxy_score = TRUE, galaxy_score_min = 55 
WHERE name = 'Momentum Breakout';

-- Volume Surge Alert: Validates organic volume
UPDATE formulas 
SET require_galaxy_score = TRUE, galaxy_score_min = 45 
WHERE name = 'Volume Surge Alert';

-- CEX-Ready Candidate: Exchanges want strong community
UPDATE formulas 
SET require_galaxy_score = TRUE, galaxy_score_min = 65 
WHERE name = 'CEX-Ready Candidate';
