CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    framework TEXT NOT NULL DEFAULT 'KPT',
    phase TEXT NOT NULL DEFAULT 'WRITING',
    max_votes_per_person INTEGER NOT NULL DEFAULT 5,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_boards_slug ON boards(slug);
