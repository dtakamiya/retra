-- Index for participant session lookup (WebSocket disconnect handling)
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON participants(session_id);

-- Index for team history and carry-over queries
CREATE INDEX IF NOT EXISTS idx_boards_team_name_phase ON boards(team_name, phase);

-- Index for board snapshots by team name
CREATE INDEX IF NOT EXISTS idx_board_snapshots_team_name ON board_snapshots(team_name);
