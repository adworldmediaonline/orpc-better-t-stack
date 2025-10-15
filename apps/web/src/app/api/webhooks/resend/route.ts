import { NextRequest, NextResponse } from "next/server";
import prisma from "@orpc-better-t-stack/db";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		const { type, data } = body;

		if (!type || !data) {
			return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
		}

		const emailId = data.email_id;

		if (!emailId) {
			console.warn("Webhook received without email_id:", type);
			return NextResponse.json({ received: true }, { status: 200 });
		}

		const recipient = await prisma.emailRecipient.findFirst({
			where: { resendEmailId: emailId },
		});

		if (!recipient) {
			console.warn(`Recipient not found for email_id: ${emailId}`);
			return NextResponse.json({ received: true }, { status: 200 });
		}

		switch (type) {
			case "email.delivered":
			case "email.delivery_delayed":
				await prisma.emailRecipient.update({
					where: { id: recipient.id },
					data: {
						status: "DELIVERED",
						deliveredAt: new Date(),
					},
				});

				await prisma.emailEvent.create({
					data: {
						emailRecipientId: recipient.id,
						eventType: "DELIVERED",
						eventData: data,
					},
				});
				break;

			case "email.opened":
				await prisma.emailRecipient.update({
					where: { id: recipient.id },
					data: {
						status: "OPENED",
						openedAt: recipient.openedAt || new Date(),
					},
				});

				await prisma.emailEvent.create({
					data: {
						emailRecipientId: recipient.id,
						eventType: "OPENED",
						eventData: data,
						ipAddress: data.ip_address,
						userAgent: data.user_agent,
					},
				});
				break;

			case "email.clicked":
				await prisma.emailRecipient.update({
					where: { id: recipient.id },
					data: {
						status: "CLICKED",
						clickedAt: recipient.clickedAt || new Date(),
					},
				});

				await prisma.emailEvent.create({
					data: {
						emailRecipientId: recipient.id,
						eventType: "CLICKED",
						eventData: data,
						ipAddress: data.ip_address,
						userAgent: data.user_agent,
					},
				});
				break;

			case "email.bounced":
				await prisma.emailRecipient.update({
					where: { id: recipient.id },
					data: {
						status: "BOUNCED",
						bouncedAt: new Date(),
					},
				});

				await prisma.emailEvent.create({
					data: {
						emailRecipientId: recipient.id,
						eventType: "BOUNCED",
						eventData: data,
					},
				});
				break;

			case "email.complained":
			case "email.spam_reported":
				await prisma.emailRecipient.update({
					where: { id: recipient.id },
					data: {
						status: "COMPLAINED",
						complaintAt: new Date(),
					},
				});

				await prisma.emailEvent.create({
					data: {
						emailRecipientId: recipient.id,
						eventType: "COMPLAINED",
						eventData: data,
					},
				});
				break;

			default:
				console.log(`Unhandled webhook type: ${type}`);
		}

		return NextResponse.json({ received: true }, { status: 200 });
	} catch (error) {
		console.error("Webhook processing error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

