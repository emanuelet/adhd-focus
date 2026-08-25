ALTER TABLE daily_reviews
  ADD COLUMN IF NOT EXISTS moved_forward_note TEXT,
  ADD COLUMN IF NOT EXISTS tomorrow_priority TEXT,
  ADD COLUMN IF NOT EXISTS loose_ends_note TEXT;

CREATE TABLE IF NOT EXISTS review_settings (
  id              BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
  must_read_days  INT NOT NULL DEFAULT 7,
  ideas_days      INT NOT NULL DEFAULT 30,
  loose_ends_days INT NOT NULL DEFAULT 7,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO review_settings (id)
VALUES (TRUE)
ON CONFLICT (id) DO NOTHING;
