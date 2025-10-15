import cron from "node-cron";
import { processScheduledEmails } from "@orpc-better-t-stack/email-service";

const ENABLE_CRON = process.env.ENABLE_CRON === "true";

export function startEmailScheduler() {
	if (!ENABLE_CRON) {
		console.log("⏸️  Email scheduler cron disabled (ENABLE_CRON=false)");
		return;
	}

	console.log("🚀 Email scheduler cron started (runs every minute)");

	cron.schedule("* * * * *", async () => {
		try {
			await processScheduledEmails();
		} catch (error) {
			console.error("Cron job error:", error);
		}
	});
}

