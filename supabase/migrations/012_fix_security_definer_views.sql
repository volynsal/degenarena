-- Migration 012: Fix Security Definer Views
-- Recreate views with security_invoker = on to respect RLS policies
-- Run this in Supabase SQL Editor

-- =============================================
-- FIX: public.leaderboard VIEW
-- =============================================
DROP VIEW IF EXISTS leaderboard;

CREATE VIEW leaderboard 
WITH (security_invoker = on) AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY f.win_rate DESC, f.total_matches DESC) as rank,
  f.id as formula_id,
  f.name as formula_name,
  f.user_id,
  p.username,
  p.avatar_url,
  f.win_rate,
  f.total_matches,
  f.avg_return,
  f.is_public
FROM formulas f
JOIN profiles p ON f.user_id = p.id
WHERE f.is_public = TRUE 
  AND f.total_matches >= 10
ORDER BY f.win_rate DESC, f.total_matches DESC;

-- =============================================
-- FIX: public.clan_leaderboard VIEW
-- =============================================
DROP VIEW IF EXISTS clan_leaderboard;

CREATE VIEW clan_leaderboard 
WITH (security_invoker = on) AS
SELECT 
  ROW_NUMBER() OVER (ORDER BY c.avg_win_rate DESC, c.total_matches DESC) as rank,
  c.id as clan_id,
  c.name,
  c.slug,
  c.logo_url,
  c.member_count,
  c.total_matches,
  c.avg_win_rate,
  c.owner_id,
  p.username as owner_username
FROM clans c
JOIN profiles p ON c.owner_id = p.id
WHERE c.is_public = TRUE
  AND c.member_count >= 3
ORDER BY c.avg_win_rate DESC, c.total_matches DESC;

-- =============================================
-- FIX: public.active_competitions VIEW
-- =============================================
DROP VIEW IF EXISTS active_competitions;

CREATE VIEW active_competitions 
WITH (security_invoker = on) AS
SELECT 
  c.*,
  CASE 
    WHEN c.starts_at > NOW() THEN 'upcoming'
    WHEN c.ends_at < NOW() THEN 'ended'
    ELSE 'live'
  END as live_status,
  EXTRACT(EPOCH FROM (c.ends_at - NOW())) as seconds_remaining
FROM competitions c
WHERE c.status IN ('upcoming', 'active')
ORDER BY c.starts_at ASC;

-- =============================================
-- VERIFY: Check that views are now secure
-- =============================================
-- You can verify by running:
-- SELECT schemaname, viewname, definition 
-- FROM pg_views 
-- WHERE viewname IN ('leaderboard', 'clan_leaderboard', 'active_competitions');
