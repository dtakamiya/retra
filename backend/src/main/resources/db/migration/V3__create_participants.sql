CREATE TABLE participants (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    session_id TEXT,
    is_facilitator INTEGER NOT NULL DEFAULT 0,
    is_online INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE INDEX idx_participants_board_id ON participants(board_id);
