export interface OutboxOperation {
	id: string;
	kind: string;
	payload: Record<string, unknown>;
	idempotencyKey: string;
	createdAt: string;
}

export interface PendingOutboxOperation extends OutboxOperation {
	attempts: number;
	lastError: string | null;
}

export interface Outbox {
	initialize(): Promise<void>;
	enqueue(operation: OutboxOperation): Promise<void>;
	pending(): Promise<PendingOutboxOperation[]>;
	acknowledge(idempotencyKeys: string[]): Promise<void>;
	fail(idempotencyKey: string, error: string): Promise<void>;
}

export interface SqlExecutor {
	execute(sql: string, values?: unknown[]): Promise<void>;
	select<T>(sql: string, values?: unknown[]): Promise<T[]>;
}

interface OutboxRow {
	id: string;
	kind: string;
	payload_json: string;
	idempotency_key: string;
	attempts: number;
	last_error: string | null;
	created_at: string;
}

export function createSqlOutbox(sql: SqlExecutor): Outbox {
	return {
		async initialize() {
			await sql.execute(`
        CREATE TABLE IF NOT EXISTS outbox_operations (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          idempotency_key TEXT NOT NULL UNIQUE,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          created_at TEXT NOT NULL
        )
      `);
		},
		async enqueue(operation) {
			await sql.execute(
				`INSERT OR IGNORE INTO outbox_operations
          (id, kind, payload_json, idempotency_key, created_at)
         VALUES (?, ?, ?, ?, ?)`,
				[
					operation.id,
					operation.kind,
					JSON.stringify(operation.payload),
					operation.idempotencyKey,
					operation.createdAt,
				],
			);
		},
		async pending() {
			const rows = await sql.select<OutboxRow>(
				`SELECT id, kind, payload_json, idempotency_key, attempts, last_error, created_at
         FROM outbox_operations ORDER BY created_at ASC`,
			);
			return rows.map((row) => ({
				id: row.id,
				kind: row.kind,
				payload: JSON.parse(row.payload_json) as Record<string, unknown>,
				idempotencyKey: row.idempotency_key,
				attempts: row.attempts,
				lastError: row.last_error,
				createdAt: row.created_at,
			}));
		},
		async acknowledge(idempotencyKeys) {
			for (const idempotencyKey of idempotencyKeys) {
				await sql.execute(
					"DELETE FROM outbox_operations WHERE idempotency_key = ?",
					[idempotencyKey],
				);
			}
		},
		async fail(idempotencyKey, error) {
			await sql.execute(
				`UPDATE outbox_operations
         SET attempts = attempts + 1, last_error = ?
         WHERE idempotency_key = ?`,
				[error, idempotencyKey],
			);
		},
	};
}
