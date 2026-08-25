import { Capacitor } from "@capacitor/core";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import type { Outbox, SqlExecutor } from "./outbox";
import { createSqlOutbox } from "./outbox";

export async function openMobileOutbox(): Promise<Outbox> {
	const sqlite = new SQLiteConnection(CapacitorSQLite);
	const database = await sqlite.createConnection(
		"adhd-focus",
		false,
		"no-encryption",
		1,
		false,
	);
	await database.open();
	const executor: SqlExecutor = {
		execute: async (sql: string, values: unknown[] = []) => {
			if (values.length === 0) {
				await database.execute(sql);
				return;
			}
			await database.run(sql, values);
		},
		async select<T>(sql: string, values: unknown[] = []) {
			return ((await database.query(sql, values)).values ?? []) as T[];
		},
	};
	const outbox = createSqlOutbox(executor);
	await outbox.initialize();
	return outbox;
}

export function isNativeMobile() {
	return Capacitor.isNativePlatform();
}
