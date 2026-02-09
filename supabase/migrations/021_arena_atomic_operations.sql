-- 021: Arena Bets - Atomic operations & RLS hardening
-- Fixes race conditions in bet placement, payouts, and pool updates.
-- Fixes overly permissive RLS policies.

-- =============================================
-- ATOMIC BET PLACEMENT
-- Deducts points and places bet in one transaction.
-- Returns JSON: { success, error, bet_id, new_balance }
-- =============================================

CREATE OR REPLACE FUNCTION place_arena_bet(
  p_user_id UUID,
  p_market_id UUID,
  p_position TEXT,
  p_amount INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance INTEGER;
  v_total_wagered INTEGER;
  v_market RECORD;
  v_existing_bet UUID;
  v_bet_id UUID;
  v_pool_field TEXT;
BEGIN
  -- Validate position
  IF p_position NOT IN ('yes', 'no') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Position must be "yes" or "no"');
  END IF;

  -- Validate amount
  IF p_amount < 10 OR p_amount > 5000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bet must be between 10 and 5,000 points');
  END IF;

  -- Ensure user_points row exists
  INSERT INTO user_points (user_id, balance)
  VALUES (p_user_id, 500)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock user's points row for update (prevents race condition)
  SELECT balance, total_wagered INTO v_balance, v_total_wagered
  FROM user_points
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error',
      format('Not enough points. You have %s pts.', v_balance));
  END IF;

  -- Check market is active and not expired (lock the row)
  SELECT id, status, resolve_at INTO v_market
  FROM arena_markets
  WHERE id = p_market_id
  FOR UPDATE;

  IF v_market.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Market not found');
  END IF;

  IF v_market.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Market is no longer active');
  END IF;

  IF v_market.resolve_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Market has expired');
  END IF;

  -- Check for existing bet
  SELECT id INTO v_existing_bet
  FROM arena_bets
  WHERE market_id = p_market_id AND user_id = p_user_id;

  IF v_existing_bet IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already placed a bet on this market');
  END IF;

  -- Deduct points atomically
  UPDATE user_points SET
    balance = balance - p_amount,
    total_wagered = COALESCE(total_wagered, 0) + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Insert bet
  INSERT INTO arena_bets (market_id, user_id, position, amount)
  VALUES (p_market_id, p_user_id, p_position, p_amount)
  RETURNING id INTO v_bet_id;

  -- Update market pool stats atomically
  IF p_position = 'yes' THEN
    UPDATE arena_markets SET
      total_pool = COALESCE(total_pool, 0) + p_amount,
      yes_pool = COALESCE(yes_pool, 0) + p_amount,
      total_bettors = COALESCE(total_bettors, 0) + 1
    WHERE id = p_market_id;
  ELSE
    UPDATE arena_markets SET
      total_pool = COALESCE(total_pool, 0) + p_amount,
      no_pool = COALESCE(no_pool, 0) + p_amount,
      total_bettors = COALESCE(total_bettors, 0) + 1
    WHERE id = p_market_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'bet_id', v_bet_id,
    'new_balance', v_balance - p_amount
  );
END;
$$;

-- =============================================
-- ATOMIC CREDIT POINTS
-- Credits points to a user and updates win/loss stats atomically.
-- =============================================

CREATE OR REPLACE FUNCTION credit_arena_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_is_win BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure user_points row exists
  INSERT INTO user_points (user_id, balance)
  VALUES (p_user_id, 500)
  ON CONFLICT (user_id) DO NOTHING;

  IF p_is_win THEN
    -- Credit balance + update win stats atomically
    UPDATE user_points SET
      balance = COALESCE(balance, 0) + p_amount,
      total_won = COALESCE(total_won, 0) + p_amount,
      total_earned = COALESCE(total_earned, 0) + p_amount,
      win_count = COALESCE(win_count, 0) + 1,
      current_streak = COALESCE(current_streak, 0) + 1,
      best_streak = GREATEST(COALESCE(current_streak, 0) + 1, COALESCE(best_streak, 0)),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Just credit balance (refund case — no streak change)
    UPDATE user_points SET
      balance = COALESCE(balance, 0) + p_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- =============================================
-- ATOMIC UPDATE STREAK (for losers)
-- =============================================

CREATE OR REPLACE FUNCTION update_arena_streak(
  p_user_id UUID,
  p_is_win BOOLEAN
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_is_win THEN
    UPDATE user_points SET
      current_streak = COALESCE(current_streak, 0) + 1,
      best_streak = GREATEST(COALESCE(current_streak, 0) + 1, COALESCE(best_streak, 0)),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_points SET
      current_streak = 0,
      loss_count = COALESCE(loss_count, 0) + 1,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- =============================================
-- FIX RLS POLICIES
-- The "Service role full access" policies with USING(TRUE)
-- effectively disable RLS for ALL users, not just service role.
-- Service role already bypasses RLS, so these policies are
-- both unnecessary and dangerous. Replace with proper scoping.
-- =============================================

-- user_points: Drop overly permissive policy
DROP POLICY IF EXISTS "Service role full access to user_points" ON user_points;

-- user_points: Users can update their own row (for daily claim via client)
CREATE POLICY "Users can update own points" ON user_points
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- arena_markets: Drop overly permissive policy (service role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role full access to arena_markets" ON arena_markets;

-- arena_bets: Drop overly permissive policy
DROP POLICY IF EXISTS "Service role full access to arena_bets" ON arena_bets;

-- arena_bets: Users can insert their own bets
CREATE POLICY "Users can insert own bets" ON arena_bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
