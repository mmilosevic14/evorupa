import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

const buildCommand =
	process.platform === "win32"
		? "node scripts/build-next-for-opennext-fixed.js"
		: undefined;

export default buildCommand ? { ...config, buildCommand } : config;
