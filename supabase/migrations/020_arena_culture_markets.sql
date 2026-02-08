-- 020: Arena Culture/Meta Markets
-- Adds narrative tagging, pinned markets, and culture market type support

-- =============================================
-- ADD MISSING COLUMNS
-- =============================================

-- Narrative tag for culture-forward market browsing
ALTER TABLE arena_markets ADD COLUMN IF NOT EXISTS narrative TEXT;

-- Pinned markets appear first in the feed
ALTER TABLE arena_markets ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;

-- =============================================
-- UPDATE market_type CHECK CONSTRAINT
-- =============================================

-- Drop the existing constraint and recreate with 'culture' included
ALTER TABLE arena_markets DROP CONSTRAINT IF EXISTS arena_markets_market_type_check;
ALTER TABLE arena_markets ADD CONSTRAINT arena_markets_market_type_check
  CHECK (market_type IN ('up_down', 'rug_call', 'moonshot', 'culture'));

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_arena_markets_narrative ON arena_markets(narrative) WHERE narrative IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_arena_markets_pinned ON arena_markets(pinned) WHERE pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_arena_markets_type ON arena_markets(market_type);
