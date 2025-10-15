"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { client, orpc } from "@/utils/orpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailStatusBadge } from "@/components/email-status-badge";
import { RecipientTable } from "@/components/recipient-table";
import { toast } from "sonner";
import { format } from "date-fns";
import {
	ArrowLeft,
	Ban,
	RotateCcw,
	Users,
	CheckCircle2,
	Eye,
	AlertTriangle,
} from "lucide-react";

interface EmailDetailContentProps {
	emailId: string;
}

export function EmailDetailContent({ emailId }: EmailDetailContentProps) {
	const router = useRouter();
	const queryClient = useQueryClient();

	// Validate emailId before making queries
	if (!emailId || emailId.trim().length === 0) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-destructive">
					Invalid email ID
				</CardContent>
			</Card>
		);
	}

	const { data: email, isLoading, error } = useQuery({
		queryKey: ["email", emailId],
		queryFn: async () => {
			return await client.emails.getEmailById({ id: emailId });
		},
		retry: false,
	});

	const cancelMutation = useMutation({
		mutationFn: async () => {
			return await client.emails.cancelEmail({ id: emailId });
		},
		onSuccess: () => {
			toast.success("Email cancelled successfully");
			queryClient.invalidateQueries({
				queryKey: ["email", emailId],
			});
		},
		onError: (error) => {
			toast.error(error.message || "Failed to cancel email");
		},
	});

	const retryMutation = useMutation({
		mutationFn: async () => {
			return await client.emails.retryFailedEmail({ id: emailId });
		},
		onSuccess: () => {
			toast.success("Email scheduled for retry");
			queryClient.invalidateQueries({
				queryKey: ["email", emailId],
			});
		},
		onError: (error) => {
			toast.error(error.message || "Failed to retry email");
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-10 w-64" />
				<Card>
					<CardContent className="p-8 space-y-4">
						<Skeleton className="h-6 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-20 w-full" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error || !email) {
		return (
			<Card>
				<CardContent className="py-8 text-center text-destructive">
					Error loading email: {error?.message || "Email not found"}
				</CardContent>
			</Card>
		);
	}

	const recipientCount = email.recipients.length;
	const deliveredCount = email.recipients.filter((r) =>
		["DELIVERED", "OPENED", "CLICKED"].includes(r.status)
	).length;
	const openedCount = email.recipients.filter((r) =>
		["OPENED", "CLICKED"].includes(r.status)
	).length;
	const bouncedCount = email.recipients.filter((r) => r.status === "BOUNCED").length;

	const deliveryRate =
		recipientCount > 0 ? Math.round((deliveredCount / recipientCount) * 100) : 0;
	const openRate =
		deliveredCount > 0 ? Math.round((openedCount / deliveredCount) * 100) : 0;
	const bounceRate =
		recipientCount > 0 ? Math.round((bouncedCount / recipientCount) * 100) : 0;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-3xl font-bold">{email.subject}</h1>
						<p className="text-muted-foreground mt-1">
							{email.status === "SENT" && email.sentAt
								? `Sent ${format(new Date(email.sentAt), "MMM d, yyyy 'at' h:mm a")}`
								: `Scheduled for ${format(new Date(email.scheduledFor), "MMM d, yyyy 'at' h:mm a")}`}
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					{email.status === "SCHEDULED" && (
						<Button
							variant="destructive"
							onClick={() => cancelMutation.mutate()}
							disabled={cancelMutation.isPending}
						>
							<Ban className="mr-2 h-4 w-4" />
							Cancel
						</Button>
					)}
					{email.status === "FAILED" && (
						<Button
							onClick={() => retryMutation.mutate()}
							disabled={retryMutation.isPending}
						>
							<RotateCcw className="mr-2 h-4 w-4" />
							Retry
						</Button>
					)}
				</div>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Email Status</CardTitle>
						<EmailStatusBadge status={email.status} />
					</div>
				</CardHeader>
				<CardContent>
					{email.error && (
						<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-4">
							<p className="text-sm text-red-800 dark:text-red-200">
								<strong>Error:</strong> {email.error}
							</p>
						</div>
					)}
					<div className="space-y-2">
						<div>
							<span className="text-sm font-medium">Subject:</span>
							<p className="text-muted-foreground">{email.subject}</p>
						</div>
						<div>
							<span className="text-sm font-medium">Scheduled For:</span>
							<p className="text-muted-foreground">
								{(() => {
									// Treat stored UTC as naive local time
									const date = new Date(email.scheduledFor);
									const year = date.getUTCFullYear();
									const month = date.getUTCMonth();
									const day = date.getUTCDate();
									const hours = date.getUTCHours();
									const minutes = date.getUTCMinutes();
									const localDate = new Date(year, month, day, hours, minutes);
									return format(localDate, "MMMM d, yyyy 'at' h:mm a");
								})()}
							</p>
						</div>
						{email.sentAt && (
							<div>
								<span className="text-sm font-medium">Sent At:</span>
								<p className="text-muted-foreground">
									{format(new Date(email.sentAt), "MMMM d, yyyy 'at' h:mm a")}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{email.status === "SENT" && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Recipients</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{recipientCount}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
							<CheckCircle2 className="h-4 w-4 text-green-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{deliveryRate}%</div>
							<p className="text-xs text-muted-foreground mt-1">
								{deliveredCount} of {recipientCount}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Open Rate</CardTitle>
							<Eye className="h-4 w-4 text-blue-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{openRate}%</div>
							<p className="text-xs text-muted-foreground mt-1">
								{openedCount} opened
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
							<AlertTriangle className="h-4 w-4 text-orange-600" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{bounceRate}%</div>
							<p className="text-xs text-muted-foreground mt-1">
								{bouncedCount} bounced
							</p>
						</CardContent>
					</Card>
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Email Content</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="border rounded-md p-4 bg-muted/30">
						<div
							dangerouslySetInnerHTML={{ __html: email.htmlBody }}
							className="prose dark:prose-invert max-w-none"
						/>
					</div>
					{email.textBody && (
						<details className="mt-4">
							<summary className="cursor-pointer text-sm font-medium">
								Plain Text Version
							</summary>
							<div className="mt-2 p-4 border rounded-md bg-muted/30">
								<pre className="whitespace-pre-wrap text-sm">{email.textBody}</pre>
							</div>
						</details>
					)}
				</CardContent>
			</Card>

			<RecipientTable recipients={email.recipients} />
		</div>
	);
}

