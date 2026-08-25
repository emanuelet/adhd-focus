import { describe, expect, it } from "vitest";
import { createSqlOutbox, type SqlExecutor } from "../outbox";

function memorySql(): SqlExecutor {
	const rows = new Map<string, Record<string, unknown>>();
	return {
		async execute(sql, values = []) {
			if (sql.startsWith("INSERT")) {
				const [id, kind, payload, key, createdAt] = values as string[];
				if (!Array.from(rows.values()).some((row) => row.key === key)) {
					rows.set(id, { id, kind, payload, key, attempts: 0, error: null, createdAt });
				}
			}
			if (sql.startsWith("DELETE")) {
				for (const [id, row] of rows) if (row.key === values[0]) rows.delete(id);
			}
			if (sql.startsWith("UPDATE")) {
				for (const row of rows.values()) {
					if (row.key === values[1]) {
						row.attempts = Number(row.attempts) + 1;
						row.error = values[0];
					}
				}
			}
		},
		async select<T>() {
			return Array.from(rows.values()).map((row) => ({
				id: row.id,
				kind: row.kind,
				payload_json: row.payload,
				idempotency_key: row.key,
				attempts: row.attempts,
				last_error: row.error,
				created_at: row.createdAt,
			})) as T[];
		},
	};
}

describe("native outbox", () => {
	it("deduplicates, retries, and acknowledges operations", async () => {
		const outbox = createSqlOutbox(memorySql());
		const operation = {
			id: "1",
			kind: "sync.push",
			payload: { entity: "capture" },
			idempotencyKey: "operation-1",
			createdAt: "2026-08-25T00:00:00.000Z",
		};
		await outbox.initialize();
		await outbox.enqueue(operation);
		await outbox.enqueue(operation);
		await outbox.fail(operation.idempotencyKey, "offline");
		expect(await outbox.pending()).toMatchObject([{ attempts: 1, lastError: "offline" }]);
		await outbox.acknowledge([operation.idempotencyKey]);
		expect(await outbox.pending()).toEqual([]);
	});
});
