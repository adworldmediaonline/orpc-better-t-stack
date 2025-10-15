"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { RecipientStatusBadge } from "./recipient-status-badge";
import { format } from "date-fns";

interface Recipient {
	id: string;
	recipientEmail: string;
	recipientName: string | null;
	status: "PENDING" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "COMPLAINED";
	deliveredAt: Date | null;
	openedAt: Date | null;
	clickedAt: Date | null;
	bouncedAt: Date | null;
	complaintAt: Date | null;
}

interface RecipientTableProps {
	recipients: Recipient[];
}

export function RecipientTable({ recipients }: RecipientTableProps) {
	if (recipients.length === 0) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-muted-foreground">
					No recipients found
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Recipients ({recipients.length})</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b">
								<th className="text-left py-2 px-4 font-medium">Email</th>
								<th className="text-left py-2 px-4 font-medium">Name</th>
								<th className="text-left py-2 px-4 font-medium">Status</th>
								<th className="text-left py-2 px-4 font-medium">Delivered</th>
								<th className="text-left py-2 px-4 font-medium">Opened</th>
							</tr>
						</thead>
						<tbody>
							{recipients.map((recipient) => (
								<tr key={recipient.id} className="border-b last:border-0">
									<td className="py-3 px-4 font-medium">
										{recipient.recipientEmail}
									</td>
									<td className="py-3 px-4 text-muted-foreground">
										{recipient.recipientName || "-"}
									</td>
									<td className="py-3 px-4">
										<RecipientStatusBadge status={recipient.status} />
									</td>
									<td className="py-3 px-4 text-sm text-muted-foreground">
										{recipient.deliveredAt
											? format(new Date(recipient.deliveredAt), "MMM d, h:mm a")
											: "-"}
									</td>
									<td className="py-3 px-4 text-sm text-muted-foreground">
										{recipient.openedAt
											? format(new Date(recipient.openedAt), "MMM d, h:mm a")
											: "-"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}

