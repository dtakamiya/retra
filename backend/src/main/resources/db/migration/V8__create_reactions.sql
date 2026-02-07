CREATE TABLE reactions (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    board_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(card_id, participant_id, emoji)
);

CREATE INDEX idx_reactions_card_id ON reactions(card_id);
CREATE INDEX idx_reactions_participant_id ON reactions(participant_id);
