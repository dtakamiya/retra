CREATE TABLE kudos (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES participants(id) ON DELETE CASCADE
);

CREATE INDEX idx_kudos_board_id ON kudos(board_id);
CREATE INDEX idx_kudos_receiver_id ON kudos(receiver_id);
