-- boards テーブルに icebreaker 関連カラムを追加
ALTER TABLE boards ADD COLUMN enable_icebreaker INTEGER NOT NULL DEFAULT 0;
ALTER TABLE boards ADD COLUMN icebreaker_question TEXT;

-- icebreaker_answers テーブルを作成
CREATE TABLE icebreaker_answers (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    participant_id TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
);

CREATE INDEX idx_icebreaker_answers_board_id ON icebreaker_answers(board_id);
CREATE INDEX idx_icebreaker_answers_participant_id ON icebreaker_answers(participant_id);
