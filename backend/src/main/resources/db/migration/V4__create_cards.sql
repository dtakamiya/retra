CREATE TABLE cards (
    id TEXT PRIMARY KEY,
    column_id TEXT NOT NULL,
    board_id TEXT NOT NULL,
    content TEXT NOT NULL,
    author_nickname TEXT,
    participant_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL
);

CREATE INDEX idx_cards_column_id ON cards(column_id);
CREATE INDEX idx_cards_board_id ON cards(board_id);
