import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "theme-color", content: "#f5a623" },
			{ title: "ADHD Focus" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/manifest.json" },
			{ rel: "icon", href: "/icons/icon-192.png" },
		],
	}),

	notFoundComponent: NotFound,

	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
				<ServiceWorkerRegister />
			</body>
		</html>
	);
}

function ServiceWorkerRegister() {
	const code = `if('serviceWorker'in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`;
	return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

function NotFound() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				height: "100vh",
				background: "var(--bg)",
				color: "var(--muted)",
				fontFamily: "var(--font-sans)",
			}}
		>
			<h1 style={{ fontSize: "3rem", margin: 0, color: "var(--accent)" }}>
				404
			</h1>
			<p style={{ margin: "0.5rem 0 0" }}>Page not found</p>
		</div>
	);
}
