CREATE TABLE action_items (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    card_id TEXT,
    content TEXT NOT NULL,
    assignee_id TEXT,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL,
    FOREIGN KEY (assignee_id) REFERENCES participants(id) ON DELETE SET NULL
);

CREATE INDEX idx_action_items_board_id ON action_items(board_id);
CREATE INDEX idx_action_items_card_id ON action_items(card_id);
CREATE INDEX idx_action_items_assignee_id ON action_items(assignee_id);
