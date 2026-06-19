import { getCookie } from "@tanstack/react-start/server";
import { verifySession } from "~/lib/auth";

export async function requireAuth() {
	const token = getCookie("session");
	if (!token || !(await verifySession(token))) {
		throw new Error("Unauthorized");
	}
}
