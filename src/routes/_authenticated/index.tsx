import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import App from "~/components/App";
import { getAppState } from "~/server/state";
import { getProjects, getTasks } from "~/server/todoist";
import { useAppStore } from "~/store/useAppStore";

export const Route = createFileRoute("/_authenticated/")({
	loader: async () => {
		const [stateResult, tasksResult, projectsResult] = await Promise.allSettled([
			getAppState(),
			getTasks(),
			getProjects(),
		]);
		const state = stateResult.status === "fulfilled" ? stateResult.value : { todayIds: [], doneIds: [], energyMap: {}, captures: [] };
		const tasks = tasksResult.status === "fulfilled" && Array.isArray(tasksResult.value) ? tasksResult.value : [];
		const projects = projectsResult.status === "fulfilled" && Array.isArray(projectsResult.value) ? projectsResult.value : [];

		return {
			state,
			tasks,
			projects,
			todoistError: tasksResult.status === "fulfilled" && projectsResult.status === "fulfilled" && Array.isArray(tasksResult.value) && Array.isArray(projectsResult.value) ? undefined : "Todoist sync failed",
		};
	},

	component: IndexPage,
});

function IndexPage() {
	const { state, tasks, projects, todoistError } = Route.useLoaderData();
	const hydrate = useAppStore((s) => s.hydrate);
	const router = useRouter();

	useEffect(() => {
		hydrate(state);
	}, [state, hydrate]);

	useEffect(() => {
		const onVisible = () => {
			if (document.visibilityState === "visible") router.invalidate();
		};
		document.addEventListener("visibilitychange", onVisible);
		return () => document.removeEventListener("visibilitychange", onVisible);
	}, [router]);

	const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

	return (
		<App
			tasks={tasks}
			projectMap={projectMap}
			todoistError={todoistError}
			onRetryTodoist={() => router.invalidate()}
		/>
	);
}
