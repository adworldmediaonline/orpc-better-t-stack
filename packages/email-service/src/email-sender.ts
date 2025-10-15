import { resend } from "./resend-client";
import prisma from "@orpc-better-t-stack/db";
import type { Email, EmailRecipient } from "@orpc-better-t-stack/db/prisma/generated/client";

interface SendEmailParams {
	email: Email;
	recipients: EmailRecipient[];
}

export async function sendEmail({ email, recipients }: SendEmailParams) {
	try {
		await prisma.email.update({
			where: { id: email.id },
			data: { status: "SENDING" },
		});

		for (const recipient of recipients) {
			try {
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
					console.error(`Failed to send to ${recipient.recipientEmail}:`, error);
					continue;
				}

				await prisma.emailRecipient.update({
					where: { id: recipient.id },
					data: {
						resendEmailId: data?.id,
						status: "PENDING",
					},
				});
			} catch (recipientError) {
				console.error(`Error sending to ${recipient.recipientEmail}:`, recipientError);
			}
		}

		await prisma.email.update({
			where: { id: email.id },
			data: {
				status: "SENT",
				sentAt: new Date(),
			},
		});

		return { success: true };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Unknown error";

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

