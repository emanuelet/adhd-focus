import { runMigrations } from "./run-migrations";

(async () => {
	await runMigrations();
})();

export const migrate = runMigrations;
