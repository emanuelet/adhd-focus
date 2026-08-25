CREATE TABLE IF NOT EXISTS organizer_items (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  url         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organizer_proposals (
  id          TEXT PRIMARY KEY,
  item_id     TEXT NOT NULL REFERENCES organizer_items(id) ON DELETE CASCADE,
  proposal    JSONB NOT NULL,
  rationale   TEXT NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organizer_proposals_item_idx ON organizer_proposals(item_id);
