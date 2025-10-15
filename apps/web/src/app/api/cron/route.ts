import { NextRequest, NextResponse } from "next/server";
import { processScheduledEmails } from "@orpc-better-t-stack/email-service";

export async function GET(req: NextRequest) {
	const authHeader = req.headers.get("authorization");
	const CRON_SECRET = process.env.CRON_SECRET;

	if (!CRON_SECRET) {
		return NextResponse.json({ error: "Cron secret not configured" }, { status: 500 });
	}

	if (authHeader !== `Bearer ${CRON_SECRET}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const result = await processScheduledEmails();
		return NextResponse.json({ success: true, ...result }, { status: 200 });
	} catch (error) {
		console.error("Cron API error:", error);
		return NextResponse.json(
			{ error: "Failed to process scheduled emails" },
			{ status: 500 }
		);
	}
}

