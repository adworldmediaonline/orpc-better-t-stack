import { resend } from "./resend-client";
import prisma from "@orpc-better-t-stack/db";
import type { Email, EmailRecipient } from "@orpc-better-t-stack/db/prisma/generated/client";

interface SendEmailParams {
	email: Email;
	recipients: EmailRecipient[];
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

