import prisma from "@orpc-better-t-stack/db";
import { sendEmail } from "./email-sender";

export async function processScheduledEmails() {
	const startTime = Date.now();

	try {
		const scheduledEmails = await prisma.email.findMany({
			where: {
				status: "SCHEDULED",
				scheduledFor: {
					lte: new Date(),
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

		if (scheduledEmails.length === 0) {
			console.log("No scheduled emails to process");
			return { processed: 0, duration: Date.now() - startTime };
		}

		console.log(`Processing ${scheduledEmails.length} scheduled emails...`);

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

