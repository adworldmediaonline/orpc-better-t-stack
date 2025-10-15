import cron from "node-cron";
import { processScheduledEmails } from "@orpc-better-t-stack/email-service";

/**
 * Cron Manager for Email Scheduling
 *
 * IMPORTANT NOTES:
 *
 * 1. LOCAL DEVELOPMENT:
 *    - Set ENABLE_CRON=true in your .env file
 *    - This will start a local cron job that runs every minute
 *    - Perfect for development and testing
 *
 * 2. PRODUCTION (VERCEL):
 *    - node-cron DOES NOT WORK on Vercel (serverless)
 *    - Vercel uses their own cron system defined in vercel.json
 *    - The /api/cron endpoint is called automatically by Vercel
 *    - ENABLE_CRON is ignored on Vercel
 *
 * 3. MANUAL TESTING:
 *    - Call GET /api/cron to manually trigger email processing
 *    - Add ?auth=your-cron-secret for authentication (optional)
 */

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
