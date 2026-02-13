-- Cards: discussion tracking columns
ALTER TABLE cards ADD COLUMN is_discussed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN discussion_order INTEGER NOT NULL DEFAULT 0;

-- Boards: anonymous mode
ALTER TABLE boards ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0;

-- Action items: priority
ALTER TABLE action_items ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM';
