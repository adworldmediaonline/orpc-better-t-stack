import { resend } from "./resend-client";
import prisma from "@orpc-better-t-stack/db";

// Types inferred from Prisma models
// We'll use the actual return types from prisma queries
type Email = {
	id: string;
	userId: string;
	subject: string;
	htmlBody: string;
	textBody: string | null;
	scheduledFor: Date;
	status: string;
	sentAt: Date | null;
	resendEmailId: string | null;
	error: string | null;
	createdAt: Date;
	updatedAt: Date;
	recipients: EmailRecipient[];
};

type EmailRecipient = {
	id: string;
	emailId: string;
	recipientEmail: string;
	recipientName: string | null;
	status: string;
	deliveredAt: Date | null;
	openedAt: Date | null;
	clickedAt: Date | null;
	bouncedAt: Date | null;
	complaintAt: Date | null;
	resendEmailId: string | null;
	createdAt: Date;
	updatedAt: Date;
};

interface SendEmailParams {
	email: Email;
	recipients: EmailRecipient[];
}

interface SendScheduledEmailParams {
	email: Email;
	recipients: EmailRecipient[];
	scheduledFor: Date;
}

export async function sendEmail({ email, recipients }: SendEmailParams) {
	console.log(`📧 Starting to send email ${email.id}: "${email.subject}" to ${recipients.length} recipients`);

	// Validate inputs
	if (!recipients || recipients.length === 0) {
		throw new Error("No recipients specified");
	}

	if (!process.env.RESEND_API_KEY) {
		throw new Error("RESEND_API_KEY environment variable is not set");
	}

	try {
		// Update status to SENDING
		await prisma.email.update({
			where: { id: email.id },
			data: { status: "SENDING" },
		});

		console.log(`📤 Updated email ${email.id} status to SENDING`);

		let successCount = 0;
		let failCount = 0;

		for (const recipient of recipients) {
			try {
				console.log(`📨 Sending to ${recipient.recipientEmail}...`);

				const { data, error } = await resend.emails.send({
					from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
					to: recipient.recipientEmail,
					subject: email.subject,
					html: email.htmlBody,
					text: email.textBody || undefined,
					tags: [
						{ name: "email_id", value: email.id },
						{ name: "recipient_id", value: recipient.id },
					],
				});

				if (error) {
					console.error(`❌ Failed to send to ${recipient.recipientEmail}:`, error);
					failCount++;
					continue;
				}

				console.log(`✅ Successfully sent to ${recipient.recipientEmail}, Resend ID: ${data?.id}`);

				await prisma.emailRecipient.update({
					where: { id: recipient.id },
					data: {
						resendEmailId: data?.id,
						status: "PENDING",
					},
				});

				successCount++;
			} catch (recipientError) {
				console.error(`❌ Error sending to ${recipient.recipientEmail}:`, recipientError);
				failCount++;
			}
		}

		// Update email status based on results
		if (successCount > 0) {
			await prisma.email.update({
				where: { id: email.id },
				data: {
					status: "SENT",
					sentAt: new Date(),
				},
			});
			console.log(`✅ Email ${email.id} marked as SENT (${successCount} recipients, ${failCount} failed)`);
		} else {
			await prisma.email.update({
				where: { id: email.id },
				data: {
					status: "FAILED",
					error: `Failed to send to all ${failCount} recipients`,
				},
			});
			console.log(`❌ Email ${email.id} marked as FAILED (all ${failCount} recipients failed)`);
		}

		return { success: successCount > 0, successCount, failCount };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error(`❌ Critical error sending email ${email.id}:`, error);

		await prisma.email.update({
			where: { id: email.id },
			data: {
				status: "FAILED",
				error: errorMessage,
			},
		});

		throw error;
	}
}

/**
 * Send email using Resend's built-in scheduled send feature
 * This uses Resend's scheduledAt parameter instead of cron jobs
 */
export async function sendScheduledEmail({ email, recipients, scheduledFor }: SendScheduledEmailParams) {
	console.log(`📧 Scheduling email ${email.id}: "${email.subject}" to ${recipients.length} recipients for ${scheduledFor.toISOString()}`);

	// Validate inputs
	if (!recipients || recipients.length === 0) {
		throw new Error("No recipients specified");
	}

	if (!process.env.RESEND_API_KEY) {
		throw new Error("RESEND_API_KEY environment variable is not set");
	}

	// Validate scheduled time is in the future (with 1 second buffer for clock skew)
	const now = new Date();
	const oneSecondAgo = new Date(now.getTime() - 1000);
	if (scheduledFor <= oneSecondAgo) {
		throw new Error("Scheduled time must be in the future");
	}

	// Check if scheduled time is more than 30 days in advance (Resend limit)
	const maxScheduledTime = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
	if (scheduledFor > maxScheduledTime) {
		throw new Error("Emails can only be scheduled up to 30 days in advance");
	}

	try {
		// Update status to SENDING
		await prisma.email.update({
			where: { id: email.id },
			data: { status: "SENDING" },
		});

		console.log(`📤 Updated email ${email.id} status to SENDING`);

		let successCount = 0;
		let failCount = 0;

		// Convert scheduled time to ISO 8601 format for Resend
		const scheduledAtISO = scheduledFor.toISOString();

		for (const recipient of recipients) {
			try {
				console.log(`📨 Scheduling email to ${recipient.recipientEmail} for ${scheduledAtISO}...`);

				const { data, error } = await resend.emails.send({
					from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
					to: recipient.recipientEmail,
					subject: email.subject,
					html: email.htmlBody,
					text: email.textBody || undefined,
					scheduledAt: scheduledAtISO,
					tags: [
						{ name: "email_id", value: email.id },
						{ name: "recipient_id", value: recipient.id },
					],
				});

				if (error) {
					console.error(`❌ Failed to schedule email to ${recipient.recipientEmail}:`, error);
					failCount++;
					continue;
				}

				console.log(`✅ Successfully scheduled email to ${recipient.recipientEmail}, Resend ID: ${data?.id}`);

				await prisma.emailRecipient.update({
					where: { id: recipient.id },
					data: {
						resendEmailId: data?.id,
						status: "PENDING",
					},
				});

				successCount++;
			} catch (recipientError) {
				console.error(`❌ Error scheduling email to ${recipient.recipientEmail}:`, recipientError);
				failCount++;
			}
		}

		// Update email status based on results
		// Keep as SCHEDULED since Resend will send it at the scheduled time
		// Status will be updated to SENT when Resend actually sends it (via webhook)
		if (successCount > 0) {
			await prisma.email.update({
				where: { id: email.id },
				data: {
					status: "SCHEDULED", // Keep as SCHEDULED until Resend actually sends it
				},
			});
			console.log(`✅ Email ${email.id} scheduled with Resend (${successCount} recipients, ${failCount} failed)`);
		} else {
			await prisma.email.update({
				where: { id: email.id },
				data: {
					status: "FAILED",
					error: `Failed to schedule email for all ${failCount} recipients`,
				},
			});
			console.log(`❌ Email ${email.id} marked as FAILED (all ${failCount} recipients failed)`);
		}

		return { success: successCount > 0, successCount, failCount };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";
		console.error(`❌ Critical error scheduling email ${email.id}:`, error);

		await prisma.email.update({
			where: { id: email.id },
			data: {
				status: "FAILED",
				error: errorMessage,
			},
		});

		throw error;
	}
}

export async function retryFailedEmail(emailId: string) {
	const email = await prisma.email.findUnique({
		where: { id: emailId },
		include: { recipients: true },
	});

	if (!email) {
		throw new Error("Email not found");
	}

	if (email.status !== "FAILED") {
		throw new Error("Only failed emails can be retried");
	}

	await prisma.email.update({
		where: { id: emailId },
		data: {
			status: "SCHEDULED",
			scheduledFor: new Date(),
			error: null,
		},
	});

	return { success: true };
}

