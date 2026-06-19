import { ExpirationPlugin } from "workbox-expiration";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
	CacheFirst,
	NetworkFirst,
	StaleWhileRevalidate,
} from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
	({ request }) =>
		request.destination === "style" || request.destination === "script",
	new CacheFirst({ cacheName: "static-assets" }),
);

registerRoute(
	({ url }) => url.pathname.startsWith("/_server/"),
	new NetworkFirst({
		cacheName: "server-fns",
		plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 300 })],
	}),
);

registerRoute(
	({ url }) => url.pathname.startsWith("/icons/"),
	new StaleWhileRevalidate({ cacheName: "icons" }),
);

self.addEventListener("activate", (event) => {
	event.waitUntil(self.clients.claim());
});
