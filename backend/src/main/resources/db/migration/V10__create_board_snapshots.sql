CREATE TABLE board_snapshots (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    framework TEXT NOT NULL,
    closed_at TEXT NOT NULL,
    total_cards INTEGER NOT NULL DEFAULT 0,
    total_votes INTEGER NOT NULL DEFAULT 0,
    total_participants INTEGER NOT NULL DEFAULT 0,
    action_items_total INTEGER NOT NULL DEFAULT 0,
    action_items_done INTEGER NOT NULL DEFAULT 0,
    snapshot_data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE INDEX idx_board_snapshots_board_id ON board_snapshots(board_id);
CREATE INDEX idx_board_snapshots_team_name ON board_snapshots(team_name);
