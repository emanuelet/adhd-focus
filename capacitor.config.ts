import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
	appId: "com.magrathea.adhdfocus",
	appName: "ADHD Focus",
	webDir: "dist/client",
	server: {
		url: "https://adhdfocus.etonello.work",
		cleartext: false,
		androidScheme: "https",
	},
};

export default config;
