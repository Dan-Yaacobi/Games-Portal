CREATE UNIQUE INDEX IF NOT EXISTS idx_game_sessions_one_active_per_user_game
ON game_sessions(user_id, game_id)
WHERE ended_at IS NULL;
