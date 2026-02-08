-- Performance indexes for frequently queried tables

-- Alerts: queried by formula_id and token_match_id in digest cron
CREATE INDEX IF NOT EXISTS idx_alerts_formula_id ON alerts(formula_id);
CREATE INDEX IF NOT EXISTS idx_alerts_token_match_id ON alerts(token_match_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_status ON alerts(user_id, status);

-- Competition entries: queried by competition + user
CREATE INDEX IF NOT EXISTS idx_competition_entries_comp_user ON competition_entries(competition_id, user_id);

-- Competition matches: queried by token_match_id
CREATE INDEX IF NOT EXISTS idx_competition_matches_token_match ON competition_matches(token_match_id);

-- Formula copies: queried by copied_by user
CREATE INDEX IF NOT EXISTS idx_formula_copies_copied_by ON formula_copies(copied_by);

-- User follows: queried by follower/following pair
CREATE INDEX IF NOT EXISTS idx_user_follows_pair ON user_follows(follower_id, following_id);

-- Token matches: queried by matched_at for cron jobs
CREATE INDEX IF NOT EXISTS idx_token_matches_matched_at ON token_matches(matched_at);

COMMENT ON INDEX idx_alerts_formula_id IS 'Speed up alert lookups by formula';
COMMENT ON INDEX idx_alerts_token_match_id IS 'Speed up alert deduplication checks';
