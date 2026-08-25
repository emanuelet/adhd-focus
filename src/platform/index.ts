import { Capacitor } from "@capacitor/core";
import type { Outbox } from "./outbox";

export type NativePlatform = "desktop" | "mobile" | "web";

export function currentPlatform(): NativePlatform {
	if (typeof window === "undefined") return "web";
	if ("__TAURI_INTERNALS__" in window) return "desktop";
	if (Capacitor.isNativePlatform()) return "mobile";
	return "web";
}

export async function openNativeOutbox(): Promise<Outbox | null> {
	switch (currentPlatform()) {
		case "desktop":
			return (await import("./desktop")).openDesktopOutbox();
		case "mobile":
			return (await import("./mobile")).openMobileOutbox();
		default:
			return null;
	}
}

export type { Outbox, OutboxOperation, PendingOutboxOperation } from "./outbox";
