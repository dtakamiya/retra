CREATE TABLE memos (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    board_id TEXT NOT NULL,
    content TEXT NOT NULL,
    author_nickname TEXT,
    participant_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL
);

CREATE INDEX idx_memos_card_id ON memos(card_id);
CREATE INDEX idx_memos_board_id ON memos(board_id);
