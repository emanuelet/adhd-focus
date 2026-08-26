import { createServerFn } from "@tanstack/react-start";
import type { TransactionSql } from "postgres";
import { db } from "~/lib/db";
import type {
	JsonObject,
	PullSyncInput,
	PullSyncResult,
	PushSyncInput,
	PushSyncResult,
	SyncChange,
	SyncEntity,
	SyncOperationInput,
	SyncOperationResult,
} from "~/types/sync";
import { requireAuth } from "./auth-guard.server";

const entities = new Set<SyncEntity>([
	"focus_slots",
	"task_meta",
	"daily_state",
	"capture",
]);
const actions = new Set(["upsert", "delete"]);
const maxLimit = 500;

function isJsonValue(
	value: unknown,
): value is import("~/types/sync").JsonValue {
	if (value === null || typeof value === "string" || typeof value === "boolean")
		return true;
	if (typeof value === "number") return Number.isFinite(value);
	if (Array.isArray(value)) return value.every(isJsonValue);
	if (typeof value === "object") {
		return Object.values(value).every(isJsonValue);
	}
	return false;
}

function isJsonObject(value: unknown): value is JsonObject {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		isJsonValue(value)
	);
}

function isUuid(value: unknown): value is string {
	return (
		typeof value === "string" &&
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
			value,
		)
	);
}

function isRevision(value: unknown): value is string {
	return typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value);
}

export function validateFocusSlots(data: JsonObject): string | undefined {
	const slots = data.slots;
	if (
		!Array.isArray(slots) ||
		slots.length > 5 ||
		!slots.every((slot) => typeof slot === "string")
	) {
		return "focus_slots.data.slots must contain at most five task IDs";
	}
	if (new Set(slots).size !== slots.length) {
		return "a task cannot occupy more than one focus slot";
	}
	return undefined;
}

function validateOperation(value: unknown): SyncOperationInput {
	if (typeof value !== "object" || value === null || Array.isArray(value))
		throw new TypeError("operation must be an object");
	const operation = value as Record<string, unknown>;
	if (!isUuid(operation.id)) throw new TypeError("operation.id must be a UUID");
	if (
		typeof operation.entity !== "string" ||
		!entities.has(operation.entity as SyncEntity)
	)
		throw new TypeError("operation.entity is invalid");
	if (
		typeof operation.key !== "string" ||
		operation.key.length === 0 ||
		operation.key.length > 200
	)
		throw new TypeError("operation.key is invalid");
	if (typeof operation.action !== "string" || !actions.has(operation.action))
		throw new TypeError("operation.action is invalid");
	if (!isRevision(operation.baseRevision))
		throw new TypeError("operation.baseRevision must be a decimal string");
	if (operation.action === "upsert" && !isJsonObject(operation.data))
		throw new TypeError("operation.data must be JSON object for upsert");
	if (operation.action === "delete" && operation.data !== undefined)
		throw new TypeError("delete operation cannot include data");
	return operation as unknown as SyncOperationInput;
}

export function validatePullInput(value: unknown): PullSyncInput {
	if (typeof value !== "object" || value === null || Array.isArray(value))
		throw new TypeError("pull input must be an object");
	const input = value as Record<string, unknown>;
	if (input.cursor !== undefined && !isRevision(input.cursor))
		throw new TypeError("cursor must be a decimal string");
	const limit = input.limit;
	if (
		limit !== undefined &&
		(typeof limit !== "number" ||
			!Number.isInteger(limit) ||
			limit < 1 ||
			limit > maxLimit)
	)
		throw new TypeError(`limit must be an integer between 1 and ${maxLimit}`);
	return {
		cursor: input.cursor as string | undefined,
		limit: limit as number | undefined,
	};
}

export function validatePushInput(value: unknown): PushSyncInput {
	if (typeof value !== "object" || value === null || Array.isArray(value))
		throw new TypeError("push input must be an object");
	const operations = (value as Record<string, unknown>).operations;
	if (!Array.isArray(operations) || operations.length > maxLimit)
		throw new TypeError(`operations must contain 0-${maxLimit} items`);
	return { operations: operations.map(validateOperation) };
}

function operationResult(row: Record<string, unknown>): SyncOperationResult {
	const result: SyncOperationResult = {
		id: String(row.operation_id),
		status: row.status as SyncOperationResult["status"],
	};
	if (row.revision !== null && row.revision !== undefined)
		result.revision = String(row.revision);
	if (row.error_code && row.error_message)
		result.error = {
			code: row.error_code as "invalid" | "conflict" | "duplicate",
			message: String(row.error_message),
		};
	return result;
}

async function pushOperation(
	sql: TransactionSql,
	operation: SyncOperationInput,
): Promise<SyncOperationResult> {
	const claimed = await sql`
    INSERT INTO sync_operations (operation_id, entity, document_key, base_revision, status)
    VALUES (${operation.id}::uuid, ${operation.entity}, ${operation.key}, ${operation.baseRevision}, 'pending')
    ON CONFLICT (operation_id) DO NOTHING
    RETURNING operation_id
  `;
	if (claimed.length === 0) {
		const existing =
			await sql`SELECT operation_id, status, revision, error_code, error_message FROM sync_operations WHERE operation_id = ${operation.id}::uuid`;
		return operationResult(existing[0] as Record<string, unknown>);
	}
	const focusError =
		operation.entity === "focus_slots" && operation.action === "upsert"
			? validateFocusSlots(operation.data as JsonObject)
			: undefined;
	if (focusError) {
		const rejected = await sql`
      UPDATE sync_operations SET status = 'rejected', error_code = 'invalid', error_message = ${focusError}, updated_at = NOW()
      WHERE operation_id = ${operation.id}::uuid
      RETURNING operation_id, status, revision, error_code, error_message
    `;
		return operationResult(rejected[0] as Record<string, unknown>);
	}
	await sql`SELECT pg_advisory_xact_lock(hashtextextended(${`${operation.entity}:${operation.key}`}, 0))`;
	const current =
		await sql`SELECT revision FROM sync_documents WHERE entity = ${operation.entity} AND document_key = ${operation.key} FOR UPDATE`;
	const currentRevision =
		current.length > 0
			? String((current[0] as { revision: string }).revision)
			: "0";
	if (currentRevision !== operation.baseRevision) {
		const conflict = await sql`
      UPDATE sync_operations SET status = 'conflict', error_code = 'conflict', error_message = ${`expected revision ${operation.baseRevision}, current revision ${currentRevision}`}, updated_at = NOW()
      WHERE operation_id = ${operation.id}::uuid
      RETURNING operation_id, status, revision, error_code, error_message
    `;
		return operationResult(conflict[0] as Record<string, unknown>);
	}
	const change = await sql`
      INSERT INTO sync_changes (operation_id, entity, document_key, data, deleted)
      VALUES (${operation.id}::uuid, ${operation.entity}, ${operation.key}, ${operation.data ? JSON.stringify(operation.data) : null}::jsonb, ${operation.action === "delete"})
      RETURNING revision
    `;
	const revision = String((change[0] as { revision: string }).revision);
	await sql`
      INSERT INTO sync_documents (entity, document_key, revision, data, deleted)
      VALUES (${operation.entity}, ${operation.key}, ${revision}, ${operation.data ? JSON.stringify(operation.data) : null}::jsonb, ${operation.action === "delete"})
      ON CONFLICT (entity, document_key) DO UPDATE SET revision = EXCLUDED.revision, data = EXCLUDED.data, deleted = EXCLUDED.deleted, updated_at = NOW()
    `;
	const applied = await sql`
      UPDATE sync_operations SET status = 'applied', revision = ${revision}, updated_at = NOW()
      WHERE operation_id = ${operation.id}::uuid
      RETURNING operation_id, status, revision, error_code, error_message
    `;
	return operationResult(applied[0] as Record<string, unknown>);
}

async function push(data: PushSyncInput): Promise<PushSyncResult> {
	const results: SyncOperationResult[] = [];
	for (const operation of data.operations) {
		results.push(await db.begin((sql) => pushOperation(sql, operation)));
	}
	const latest =
		await db`SELECT COALESCE(MAX(revision), 0) AS revision FROM sync_changes`;
	return {
		operations: results,
		nextCursor: String((latest[0] as { revision: string }).revision),
	};
}

async function pull(data: PullSyncInput): Promise<PullSyncResult> {
	const cursor = data.cursor ?? "0";
	const limit = data.limit ?? 100;
	const rows = await db`
    SELECT revision, operation_id, entity, document_key, data, deleted
    FROM sync_changes WHERE revision > ${cursor} ORDER BY revision ASC LIMIT ${limit + 1}
  `;
	const hasMore = rows.length > limit;
	const changes = rows.slice(0, limit).map((row) => {
		const item = row as Record<string, unknown>;
		const change: SyncChange = {
			revision: String(item.revision),
			operationId: String(item.operation_id),
			entity: item.entity as SyncEntity,
			key: String(item.document_key),
			action: item.deleted ? "delete" : "upsert",
		};
		if (!item.deleted) change.data = item.data as JsonObject;
		return change;
	});
	return { changes, nextCursor: changes.at(-1)?.revision ?? cursor, hasMore };
}

export const pullSync = createServerFn({ method: "GET" })
	.validator(validatePullInput)
	.handler(async ({ data }) => {
		await requireAuth();
		return pull(data);
	});

export const pushSync = createServerFn({ method: "POST" })
	.validator(validatePushInput)
	.handler(async ({ data }) => {
		await requireAuth();
		return push(data);
	});

export const syncTestHelpers = { pull, push, validateOperation };
