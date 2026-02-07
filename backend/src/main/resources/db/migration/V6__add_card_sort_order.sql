ALTER TABLE cards ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_cards_sort_order ON cards(column_id, sort_order);
