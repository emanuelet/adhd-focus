export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type SyncEntity =
	| "focus_slots"
	| "task_meta"
	| "daily_state"
	| "capture";
export type SyncOperationAction = "upsert" | "delete";
export type SyncOperationStatus =
	| "pending"
	| "applied"
	| "conflict"
	| "rejected";

export interface SyncOperationInput {
	id: string;
	entity: SyncEntity;
	key: string;
	action: SyncOperationAction;
	baseRevision: string;
	data?: JsonObject;
}

export interface SyncChange {
	revision: string;
	operationId: string;
	entity: SyncEntity;
	key: string;
	action: SyncOperationAction;
	data?: JsonObject;
}

export interface PullSyncInput {
	cursor?: string;
	limit?: number;
}

export interface PullSyncResult {
	changes: SyncChange[];
	nextCursor: string;
	hasMore: boolean;
}

export interface SyncOperationResult {
	id: string;
	status: SyncOperationStatus;
	revision?: string;
	error?: {
		code: "invalid" | "conflict" | "duplicate";
		message: string;
	};
}

export interface PushSyncInput {
	operations: SyncOperationInput[];
}

export interface PushSyncResult {
	operations: SyncOperationResult[];
	nextCursor: string;
}
