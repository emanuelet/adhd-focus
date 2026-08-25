export type CommandKind =
	| "state.today"
	| "state.done"
	| "energy.set"
	| "energy.delete"
	| "todoist.close"
	| "capture.create"
	| "capture.delete"
	| "capture.send";

export interface CommandInput {
	id: string;
	kind: CommandKind;
	payload: JsonObject;
}

export interface CommandResult {
	todoistTaskId?: string;
}
import type { JsonObject } from "./sync";
