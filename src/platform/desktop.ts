import type { Outbox } from "./outbox";
import { createSqlOutbox } from "./outbox";

export async function openDesktopOutbox(): Promise<Outbox> {
	const { default: Database } = await import("@tauri-apps/plugin-sql");
	const database = await Database.load("sqlite:adhd-focus.db");
	const outbox = createSqlOutbox({
		execute: async (sql, values = []) => {
			await database.execute(sql, values);
		},
		select: (sql, values = []) => database.select(sql, values),
	});
	await outbox.initialize();
	return outbox;
}
