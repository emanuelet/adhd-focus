import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { toNodeHandler } from "srvx/node";
import app from "./dist/server/server.js";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const host = process.env.HOST ?? "0.0.0.0";
const clientDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "dist/client");
const contentTypes = {
	".css": "text/css; charset=utf-8",
	".ico": "image/x-icon",
	".js": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".webp": "image/webp",
};

function serveStaticFile(request, response) {
	const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
	const filePath = resolve(clientDirectory, `.${decodeURIComponent(pathname)}`);
	if (!filePath.startsWith(`${clientDirectory}/`) || !existsSync(filePath)) return false;

	const file = statSync(filePath);
	if (!file.isFile()) return false;

	response.statusCode = 200;
	response.setHeader("content-length", file.size);
	response.setHeader("content-type", contentTypes[extname(filePath)] ?? "application/octet-stream");
	if (request.method === "HEAD") response.end();
	else createReadStream(filePath).pipe(response);
	return true;
}

const appHandler = toNodeHandler(app.fetch);
const server = createServer((request, response) => {
	if (serveStaticFile(request, response)) return;
	return appHandler(request, response);
});

server.listen(port, host, () => {
	console.info(`ADHD Focus listening on ${host}:${port}`);
});
