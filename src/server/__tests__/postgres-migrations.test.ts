import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const schema = `adhd_focus_test_${crypto.randomUUID().replaceAll("-", "")}`;
const migrations = [
	"001_initial.sql",
	"002_sync.sql",
	"003_organizer.sql",
	"004_review.sql",
	"005_command_operations.sql",
];

describeDatabase("PostgreSQL migrations", () => {
	const sql = postgres(databaseUrl as string, { max: 1 });

	beforeAll(async () => {
		await sql.unsafe(`CREATE SCHEMA ${schema}`);
		await sql.unsafe(`SET search_path TO ${schema}`);
		for (const migration of migrations) {
			await sql.unsafe(
				readFileSync(
					join(import.meta.dirname, "../../lib/db/migrations", migration),
					"utf8",
				),
			);
		}
	});

	afterAll(async () => {
		await sql.unsafe(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
		await sql.end();
	});

	it("applies all native-sync tables and enforces idempotency", async () => {
		await sql`
      INSERT INTO sync_operations (operation_id, entity, document_key, base_revision, status)
      VALUES ('550e8400-e29b-41d4-a716-446655440000', 'capture', 'capture-1', 0, 'pending')
    `;
		await expect(sql`
      INSERT INTO sync_operations (operation_id, entity, document_key, base_revision, status)
      VALUES ('550e8400-e29b-41d4-a716-446655440000', 'capture', 'capture-1', 0, 'pending')
    `).rejects.toThrow();
		const tables = await sql<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = ${schema}
    `;
		expect(tables.map((table) => table.tablename)).toEqual(
			expect.arrayContaining([
				"sync_documents",
				"sync_changes",
				"sync_operations",
				"organizer_items",
				"review_settings",
				"command_operations",
			]),
		);
	});
});
