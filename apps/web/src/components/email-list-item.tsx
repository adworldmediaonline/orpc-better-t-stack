"use client";

import { Card, CardContent } from "./ui/card";
import { EmailStatusBadge } from "./email-status-badge";
import { RecipientStatusBadge } from "./recipient-status-badge";
import { format } from "date-fns";
import { Users, Eye, CheckCircle2 } from "lucide-react";

interface Email {
	id: string;
	subject: string;
	status: "SCHEDULED" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";
	scheduledFor: Date;
	sentAt: Date | null;
	recipients: Array<{
		id: string;
		status: "PENDING" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "COMPLAINED";
	}>;
}

interface EmailListItemProps {
	email: Email;
	onClick: () => void;
}

export function EmailListItem({ email, onClick }: EmailListItemProps) {
	const recipientCount = email.recipients.length;
	const deliveredCount = email.recipients.filter((r) =>
		["DELIVERED", "OPENED", "CLICKED"].includes(r.status)
	).length;
	const openedCount = email.recipients.filter((r) =>
		["OPENED", "CLICKED"].includes(r.status)
	).length;

	const deliveryRate =
		recipientCount > 0 ? Math.round((deliveredCount / recipientCount) * 100) : 0;
	const openRate =
		deliveredCount > 0 ? Math.round((openedCount / deliveredCount) * 100) : 0;


	// Debug: Log the scheduledFor value received from API
	console.log("🔍 EmailListItem DEBUG:", {
		subject: email.subject,
		scheduledFor: email.scheduledFor,
		scheduledForType: typeof email.scheduledFor,
		scheduledForString: email.scheduledFor.toString(),
		scheduledForISO: email.scheduledFor.toISOString(),
		formattedDisplay: format(new Date(email.scheduledFor), "MMM d, h:mm a"),
	});

	// Helper function to format date without timezone conversion issues
	const formatScheduledTime = (date: Date): string => {
		console.log("🔍 formatScheduledTime DEBUG:", {
			inputDate: date.toString(),
			inputISO: date.toISOString(),
			year: date.getFullYear(),
			month: date.getMonth(),
			day: date.getDate(),
			hours: date.getHours(),
			minutes: date.getMinutes(),
		});

		// Get the local components directly to avoid timezone conversion
		const year = date.getFullYear();
		const month = date.getMonth();
		const day = date.getDate();
		const hours = date.getHours();
		const minutes = date.getMinutes();

		// Create a new date with the same local components
		const localDate = new Date(year, month, day, hours, minutes);
		const result = format(localDate, "MMM d, h:mm a");

		console.log("🔍 formatScheduledTime RESULT:", {
			localDate: localDate.toString(),
			result,
		});

		return result;
	};

	return (
		<Card
			className="cursor-pointer hover:shadow-md transition-shadow"
			onClick={onClick}
		>
			<CardContent className="p-6">
				<div className="flex justify-between items-start gap-4">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-3 mb-2">
							<h3 className="text-lg font-semibold truncate">{email.subject}</h3>
							<EmailStatusBadge status={email.status} />
						</div>

						<p className="text-sm text-muted-foreground mb-3">
							{email.status === "SENT" && email.sentAt
								? `Sent ${formatScheduledTime(new Date(email.sentAt))}`
								: `Scheduled for ${formatScheduledTime(new Date(email.scheduledFor))}`}
						</p>

						<div className="flex flex-wrap gap-4 text-sm">
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span>{recipientCount} recipient{recipientCount !== 1 ? "s" : ""}</span>
							</div>

							{email.status === "SENT" && (
								<>
									<div className="flex items-center gap-2">
										<CheckCircle2 className="h-4 w-4 text-green-600" />
										<span>{deliveryRate}% delivered</span>
									</div>
									<div className="flex items-center gap-2">
										<Eye className="h-4 w-4 text-blue-600" />
										<span>{openRate}% opened</span>
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

