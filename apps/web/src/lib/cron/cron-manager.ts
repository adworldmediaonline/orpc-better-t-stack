import cron from "node-cron";
import { processScheduledEmails } from "@orpc-better-t-stack/email-service";

const ENABLE_CRON = process.env.ENABLE_CRON === "true";

class CronManager {
	private static instance: CronManager;
	private isStarted = false;

	private constructor() {}

	public static getInstance(): CronManager {
		if (!CronManager.instance) {
			CronManager.instance = new CronManager();
		}
		return CronManager.instance;
	}

	public start(): void {
		if (this.isStarted) {
			console.log("⏸️  Email scheduler already started");
			return;
		}

		if (!ENABLE_CRON) {
			console.log("⏸️  Email scheduler cron disabled (ENABLE_CRON=false)");
			return;
		}

		console.log("🚀 Email scheduler cron started (runs every minute)");

		cron.schedule("* * * * *", async () => {
			try {
				console.log("🔄 [AUTO] Processing scheduled emails...");
				const result = await processScheduledEmails();
				console.log("✅ [AUTO] Cron job completed:", result);
			} catch (error) {
				console.error("❌ [AUTO] Cron job error:", error);
			}
		});

		this.isStarted = true;
	}

	public isCronStarted(): boolean {
		return this.isStarted;
	}
}

// Auto-start the cron job when this module is imported
const cronManager = CronManager.getInstance();
cronManager.start();

export { CronManager };
