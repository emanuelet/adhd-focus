CREATE SEQUENCE IF NOT EXISTS sync_revision_seq AS BIGINT;

CREATE TABLE IF NOT EXISTS sync_documents (
  entity       TEXT        NOT NULL,
  document_key TEXT        NOT NULL,
  revision     BIGINT      NOT NULL,
  data         JSONB,
  deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity, document_key),
  CHECK (deleted OR data IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS sync_changes (
  revision     BIGINT      PRIMARY KEY DEFAULT nextval('sync_revision_seq'),
  operation_id UUID        NOT NULL UNIQUE,
  entity       TEXT        NOT NULL,
  document_key TEXT        NOT NULL,
  data         JSONB,
  deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sync_changes_revision_idx ON sync_changes (revision);

CREATE TABLE IF NOT EXISTS sync_operations (
  operation_id UUID        PRIMARY KEY,
  entity       TEXT        NOT NULL,
  document_key TEXT        NOT NULL,
  base_revision BIGINT     NOT NULL,
  status       TEXT        NOT NULL CHECK (status IN ('pending', 'applied', 'conflict', 'rejected')),
  revision     BIGINT,
  error_code   TEXT,
  error_message TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
