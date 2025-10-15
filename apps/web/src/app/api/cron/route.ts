import { NextRequest, NextResponse } from "next/server";
import { processScheduledEmails } from "@orpc-better-t-stack/email-service";
import { CronManager } from "@/lib/cron/cron-manager";

// Ensure cron manager is started
const cronManager = CronManager.getInstance();

export async function GET(req: NextRequest) {
	// Check if request is from Vercel Cron
	const isVercelCron = req.headers.get("x-vercel-cron-id");

	// Check authorization for non-Vercel requests
	if (!isVercelCron) {
		const authHeader = req.headers.get("authorization");
		const CRON_SECRET = process.env.CRON_SECRET;

		// Allow requests without auth in development
		if (process.env.NODE_ENV !== "development") {
			if (!CRON_SECRET) {
				return NextResponse.json(
					{ error: "Cron secret not configured" },
					{ status: 500 }
				);
			}

			if (authHeader !== `Bearer ${CRON_SECRET}`) {
				return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
			}
		}
	}

	try {
		console.log("🔄 [MANUAL] Processing scheduled emails...");
		const result = await processScheduledEmails();
		console.log("✅ [MANUAL] Cron job completed:", result);

		return NextResponse.json({
			success: true,
			...result,
			cronStatus: {
				autoCronStarted: cronManager.isCronStarted(),
				environment: process.env.NODE_ENV
			}
		}, { status: 200 });
	} catch (error) {
		console.error("❌ [MANUAL] Cron API error:", error);
		return NextResponse.json(
			{ error: "Failed to process scheduled emails" },
			{ status: 500 }
		);
	}
}

