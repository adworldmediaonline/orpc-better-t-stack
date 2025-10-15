import prisma from "@orpc-better-t-stack/db";
import { sendEmail } from "./email-sender";

export async function processScheduledEmails() {
	const startTime = Date.now();

	try {
		const now = new Date();

		// Debug logging for timezone analysis
		console.log("🔍 EMAIL SCHEDULER DEBUG:");
		console.log("  - Current time (local):", now.toString());
		console.log("  - Current time (UTC):", now.toISOString());
		console.log("  - Current time (getTime):", now.getTime());

		// CRITICAL FIX: Since we store "naive local time as UTC",
		// we need to compare against current time in the same way
		// Extract current time components and create a "naive UTC" time for comparison
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();
		const currentDay = now.getDate();
		const currentHour = now.getHours();
		const currentMinute = now.getMinutes();

		// Create a naive UTC date representing the current local time
		// This matches how we store scheduled times
		const naiveCurrentTime = new Date(Date.UTC(currentYear, currentMonth, currentDay, currentHour, currentMinute));

		console.log("🔍 TIMEZONE FIX DEBUG:");
		console.log("  - Current local components:", { currentYear, currentMonth, currentDay, currentHour, currentMinute });
		console.log("  - Naive current time (UTC):", naiveCurrentTime.toISOString());
		console.log("  - Naive current time (getTime):", naiveCurrentTime.getTime());

		const scheduledEmails = await prisma.email.findMany({
			where: {
				status: "SCHEDULED",
				scheduledFor: {
					lte: naiveCurrentTime,  // Use naive time for comparison
				},
			},
			include: {
				recipients: true,
			},
			take: 10,
			orderBy: {
				scheduledFor: "asc",
			},
		});

		// Debug logging for found emails
		console.log(`🔍 Found ${scheduledEmails.length} scheduled emails to process:`);
		scheduledEmails.forEach((email, index) => {
			console.log(`  Email ${index + 1}:`, {
				id: email.id,
				subject: email.subject,
				scheduledFor: email.scheduledFor.toString(),
				scheduledForISO: email.scheduledFor.toISOString(),
				scheduledForTime: email.scheduledFor.getTime(),
				timeDifference: naiveCurrentTime.getTime() - email.scheduledFor.getTime(),
				timeDifferenceMinutes: Math.round((naiveCurrentTime.getTime() - email.scheduledFor.getTime()) / (1000 * 60)),
				recipients: email.recipients.length
			});
		});

		if (scheduledEmails.length === 0) {
			console.log("✅ No scheduled emails to process");
			return { processed: 0, duration: Date.now() - startTime };
		}

		console.log(`🚀 Processing ${scheduledEmails.length} scheduled emails...`);

		let successCount = 0;
		let failCount = 0;

		for (const email of scheduledEmails) {
			try {
				await sendEmail({ email, recipients: email.recipients });
				successCount++;
				console.log(`✓ Sent email ${email.id}: "${email.subject}"`);
			} catch (error) {
				failCount++;
				console.error(`✗ Failed to send email ${email.id}:`, error);
			}
		}

		const duration = Date.now() - startTime;
		console.log(`Processed ${scheduledEmails.length} emails in ${duration}ms (${successCount} success, ${failCount} failed)`);

		return { processed: scheduledEmails.length, success: successCount, failed: failCount, duration };
	} catch (error) {
		console.error("Error processing scheduled emails:", error);
		throw error;
	}
}

