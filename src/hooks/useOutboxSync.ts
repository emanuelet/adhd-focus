import { useEffect } from "react";
import { openNativeOutbox } from "~/platform";
import { runCommand } from "~/server/commands";
import type { CommandKind } from "~/types/commands";

export function useOutboxSync() {
	useEffect(() => {
		let stopped = false;
		const replay = async () => {
			const outbox = await openNativeOutbox();
			if (!outbox) return;
			for (const operation of await outbox.pending()) {
				if (stopped) return;
				try {
					await runCommand({
						data: {
							id: operation.idempotencyKey,
							kind: operation.kind as CommandKind,
							payload: operation.payload,
						},
					});
					await outbox.acknowledge([operation.idempotencyKey]);
				} catch (error) {
					await outbox.fail(
						operation.idempotencyKey,
						error instanceof Error ? error.message : String(error),
					);
				}
			}
		};
		void replay();
		window.addEventListener("online", replay);
		return () => {
			stopped = true;
			window.removeEventListener("online", replay);
		};
	}, []);
}
