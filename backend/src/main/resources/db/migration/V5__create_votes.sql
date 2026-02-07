CREATE TABLE votes (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE(card_id, participant_id)
);

CREATE INDEX idx_votes_card_id ON votes(card_id);
CREATE INDEX idx_votes_participant_id ON votes(participant_id);
