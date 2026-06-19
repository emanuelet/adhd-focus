import { createFileRoute, isRedirect, redirect } from "@tanstack/react-router";
import { verifySessionCookie } from "~/server/auth";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ location }) => {
		try {
			await verifySessionCookie();
		} catch (error) {
			if (isRedirect(error)) throw error;
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}
	},
});
