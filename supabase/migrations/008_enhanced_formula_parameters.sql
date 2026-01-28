-- Enhanced Formula Parameters
-- Adds new filters for Launch Sniper, Momentum Breakout, and Healthy Accumulation strategies

-- Token Age (minimum to avoid first minutes chaos)
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS token_age_min_minutes INTEGER;

-- Buy/Sell Ratio filters
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS buy_sell_ratio_1h_min DECIMAL(5,2);

-- Transaction count filters
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS tx_count_1h_min INTEGER;
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS tx_count_24h_min INTEGER;

-- Market Cap / FDV filters
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS fdv_min BIGINT;
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS fdv_max BIGINT;

-- Price Change filters (percentages, can be negative)
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS price_change_1h_min DECIMAL(8,2);
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS price_change_1h_max DECIMAL(8,2);
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS price_change_6h_min DECIMAL(8,2);
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS price_change_6h_max DECIMAL(8,2);
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS price_change_24h_min DECIMAL(8,2);
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS price_change_24h_max DECIMAL(8,2);

-- Volume Spike filters (multiplier: 2.0 = 2x normal volume)
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS volume_1h_vs_6h_spike DECIMAL(5,2);
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS volume_6h_vs_24h_spike DECIMAL(5,2);

-- Comments explaining the strategies these support:
-- 
-- LAUNCH SNIPER:
--   token_age_min_minutes: 5-10 (avoid bots in first minutes)
--   token_age_max_hours: 1-6 (catch early)
--   buy_sell_ratio_1h_min: 1.5+ (more buyers)
--   tx_count_1h_min: 50+ (real interest)
--   fdv_min/max: $50k-$5M (micro-cap focus)
--   price_change_1h_min: 5%+ (momentum confirmation)
--
-- MOMENTUM BREAKOUT:
--   volume_1h_vs_6h_spike: 3.0+ (unusual volume)
--   price_change_1h_min: 5% (starting to move)
--   price_change_1h_max: 50% (not already pumped)
--   buy_sell_ratio_1h_min: 1.2+ (buyers dominating)
--   liquidity_min: $10k+ (exit liquidity)
--
-- HEALTHY ACCUMULATION:
--   price_change_24h_min: -10% (not dumping)
--   price_change_24h_max: 20% (not already pumping)
--   volume_6h_vs_24h_spike: < 0.8 (volume decreasing = quiet)
--   token_age_max_hours: 72+ (survived initial volatility)
--   fdv_min: $100k+ (established)
