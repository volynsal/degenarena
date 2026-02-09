-- =============================================
-- Migration 023: New Arena Market Types
-- Adds versus, narrative_index, culture_crypto, and meta market types
-- Plus flexible market_data JSONB column for type-specific payloads
-- =============================================

-- ── 1. Expand market_type constraint ──
ALTER TABLE arena_markets DROP CONSTRAINT IF EXISTS arena_markets_market_type_check;
ALTER TABLE arena_markets ADD CONSTRAINT arena_markets_market_type_check
  CHECK (market_type IN (
    'up_down',        -- Standard price direction
    'rug_call',       -- Rug detection
    'moonshot',       -- 2x pump prediction
    'culture',        -- Culturally-framed single-token
    'versus',         -- Head-to-head: token A vs token B (relative performance)
    'narrative_index', -- Bet on a narrative basket (avg of top N tokens)
    'culture_crypto',  -- Culture-crypto hybrids (culturally framed, resolved on DexScreener data)
    'meta'            -- Ecosystem-level markets (DexScreener trending snapshots)
  ));

-- ── 2. Allow nullable token fields for index/meta markets ──
-- These market types don't have a single underlying token
ALTER TABLE arena_markets ALTER COLUMN token_address DROP NOT NULL;
ALTER TABLE arena_markets ALTER COLUMN price_at_creation DROP NOT NULL;

-- ── 3. Add flexible data column for type-specific payloads ──
-- Versus: { token_b: { address, symbol, name, price_at_creation, price_at_resolution } }
-- Narrative Index: { narrative, threshold_pct, tokens: [{ address, symbol, price_at_creation }] }
-- Culture Crypto: { metric, threshold, narrative, resolution_data }
-- Meta: { snapshot_at_creation, metric, threshold }
ALTER TABLE arena_markets ADD COLUMN IF NOT EXISTS market_data JSONB DEFAULT '{}';

-- ── 4. Index for market_data queries ──
CREATE INDEX IF NOT EXISTS idx_arena_markets_market_data
  ON arena_markets USING gin (market_data) WHERE market_data != '{}';
