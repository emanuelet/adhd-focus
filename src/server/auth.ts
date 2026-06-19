import { createServerFn } from "@tanstack/react-start";
import {
	deleteCookie,
	getCookie,
	setCookie,
} from "@tanstack/react-start/server";
import { signSession, verifySession } from "~/lib/auth";

export const verifySessionCookie = createServerFn({ method: "GET" }).handler(
	async () => {
		const token = getCookie("session");
		if (!token || !(await verifySession(token))) {
			throw new Error("Unauthorized");
		}
		return { ok: true };
	},
);

export const login = createServerFn({ method: "POST" })
	.validator((d: unknown): { password: string } => {
		if (typeof d !== "object" || d === null) throw new Error("Invalid input");
		if (!("password" in d) || typeof (d as any).password !== "string")
			throw new Error("Password required");
		return d as { password: string };
	})
	.handler(async ({ data }) => {
		if (data.password !== process.env.APP_PASSWORD) {
			throw new Error("Incorrect password");
		}
		const token = await signSession();
		setCookie("session", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});
		return { ok: true };
	});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
	deleteCookie("session");
	return { ok: true };
});
