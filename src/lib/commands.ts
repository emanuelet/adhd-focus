import { uid } from "~/lib/utils";
import { openNativeOutbox } from "~/platform";
import { runCommand } from "~/server/commands";
import type { CommandKind, CommandResult } from "~/types/commands";
import type { JsonObject } from "~/types/sync";

export async function executeCommand(
	kind: CommandKind,
	payload: JsonObject,
): Promise<CommandResult> {
	const id = uid();
	try {
		return await runCommand({ data: { id, kind, payload } });
	} catch (error) {
		const outbox = await openNativeOutbox();
		if (!outbox) throw error;
		await outbox.enqueue({
			id,
			kind,
			payload,
			idempotencyKey: id,
			createdAt: new Date().toISOString(),
		});
		return {};
	}
}
