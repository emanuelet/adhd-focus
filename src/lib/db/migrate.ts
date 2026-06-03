import { db } from '../db'

let ran = false

export async function migrate() {
  if (ran) return
  ran = true

  await db`
    CREATE TABLE IF NOT EXISTS daily_state (
      date        DATE        PRIMARY KEY,
      today_ids   TEXT[]      NOT NULL DEFAULT '{}',
      done_ids    TEXT[]      NOT NULL DEFAULT '{}',
      streak_days   INT       NOT NULL DEFAULT 0,
      tasks_best_30 INT       NOT NULL DEFAULT 0,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS task_meta (
      task_id    TEXT        PRIMARY KEY,
      level      TEXT        CHECK (level IN ('low', 'med', 'high')),
      time_of_day TEXT       CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'anytime')),
      is_quick   BOOLEAN    NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS captures (
      id               TEXT        PRIMARY KEY,
      text             TEXT        NOT NULL,
      is_url           BOOLEAN     NOT NULL DEFAULT FALSE,
      parent_task_id   TEXT,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_to_todoist  BOOLEAN     NOT NULL DEFAULT FALSE,
      todoist_task_id  TEXT
    )
  `
  await db`
    CREATE TABLE IF NOT EXISTS daily_reviews (
      date              DATE        PRIMARY KEY,
      wins_note         TEXT,
      improve_note      TEXT,
      total_sprints     INT         NOT NULL DEFAULT 0,
      total_focus_mins  INT         NOT NULL DEFAULT 0,
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}
