"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orpc } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { DataTable, createSortableHeader, createSelectColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
	Plus,
	Eye,
	Trash2,
	MoreHorizontal,
	Calendar,
	Users,
	Mail
} from "lucide-react";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type EmailStatus = "SCHEDULED" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";

interface Email {
	id: string;
	subject: string;
	status: EmailStatus;
	scheduledFor: Date;
	recipients: Array<{
		id: string;
		recipientEmail: string;
		recipientName: string | null;
		status: string;
	}>;
	createdAt: Date;
}

const getStatusBadge = (status: EmailStatus) => {
	const statusConfig = {
		SCHEDULED: { label: "Scheduled", variant: "default" as const, className: "bg-info/10 text-info border-info/20" },
		SENDING: { label: "Sending", variant: "default" as const, className: "bg-warning/10 text-warning border-warning/20" },
		SENT: { label: "Sent", variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
		FAILED: { label: "Failed", variant: "destructive" as const, className: "bg-destructive/10 text-destructive border-destructive/20" },
		CANCELLED: { label: "Cancelled", variant: "secondary" as const, className: "bg-muted/10 text-muted-foreground border-muted/20" },
	};

	const config = statusConfig[status];
	return (
		<Badge variant={config.variant} className={`${config.className} font-medium`}>
			{config.label}
		</Badge>
	);
};

export function EmailsContent() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"all" | EmailStatus>("all");
	const [page, setPage] = useState(1);

	const statusFilter: EmailStatus | undefined = activeTab === "all" ? undefined : activeTab;

	// Build query params without undefined values
	const queryParams: any = {
		page,
		limit: 20,
	};

	if (statusFilter) {
		queryParams.status = statusFilter;
	}

	const { data, isLoading, error } = useQuery({
		...orpc.emails.getEmails.queryOptions(queryParams),
		queryKey: ["emails", page, statusFilter] as const,
	});

	const columns: ColumnDef<Email>[] = useMemo(
		() => [
			createSelectColumn<Email>(),
			{
				accessorKey: "subject",
				header: createSortableHeader("Subject", "subject"),
				cell: ({ row }) => {
					const email = row.original;
					return (
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-primary/10">
								<Mail className="h-4 w-4 text-primary" />
							</div>
							<div>
								<div className="font-medium text-foreground">{email.subject}</div>
								<div className="text-sm text-muted-foreground">
									Created {format(new Date(email.createdAt), "MMM d, yyyy")}
								</div>
							</div>
						</div>
					);
				},
			},
			{
				accessorKey: "status",
				header: createSortableHeader("Status", "status"),
				cell: ({ row }) => {
					return getStatusBadge(row.getValue("status"));
				},
			},
			{
				accessorKey: "scheduledFor",
				header: createSortableHeader("Scheduled", "scheduledFor"),
				cell: ({ row }) => {
					const date = new Date(row.getValue("scheduledFor"));
					// Format date for display - treat stored UTC as naive local time
					const year = date.getUTCFullYear();
					const month = date.getUTCMonth();
					const day = date.getUTCDate();
					const hours = date.getUTCHours();
					const minutes = date.getUTCMinutes();
					const localDate = new Date(year, month, day, hours, minutes);

					return (
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-muted-foreground" />
							<div className="text-sm">
								<div className="font-medium">{format(localDate, "MMM d, yyyy")}</div>
								<div className="text-muted-foreground">{format(localDate, "h:mm a")}</div>
							</div>
						</div>
					);
				},
			},
			{
				accessorKey: "recipients",
				header: createSortableHeader("Recipients", "recipients"),
				cell: ({ row }) => {
					const recipients = row.getValue("recipients") as Email["recipients"];
					return (
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4 text-muted-foreground" />
							<span className="font-medium">{recipients.length}</span>
							<span className="text-sm text-muted-foreground">recipients</span>
						</div>
					);
				},
			},
			{
				id: "actions",
				header: "Actions",
				cell: ({ row }) => {
					const email = row.original;
					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-8 w-8 p-0 focus-ring">
									<span className="sr-only">Open menu</span>
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Actions</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => router.push(`/emails/${email.id}`)}>
									<Eye className="mr-2 h-4 w-4" />
									View Details
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="text-destructive" disabled>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					);
				},
			},
		],
		[router]
	);

	const tabs = [
		{ key: "all" as const, label: "All Emails" },
		{ key: "SCHEDULED" as const, label: "Scheduled" },
		{ key: "SENT" as const, label: "Sent" },
		{ key: "FAILED" as const, label: "Failed" },
	];

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<div className="p-4 rounded-full bg-destructive/10 mb-4">
					<Mail className="h-8 w-8 text-destructive" />
				</div>
				<h3 className="text-lg font-semibold mb-2">Error loading emails</h3>
				<p className="text-muted-foreground mb-4">{error.message}</p>
				<Button onClick={() => window.location.reload()}>
					Try Again
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6 animate-fade-in-up">
			{/* Header */}
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
				<div className="flex items-center gap-4">
					{tabs.map((tab) => (
						<Button
							key={tab.key}
							variant={activeTab === tab.key ? "default" : "ghost"}
							size="sm"
							onClick={() => {
								setActiveTab(tab.key);
								setPage(1);
							}}
							className="focus-ring"
						>
							{tab.label}
						</Button>
					))}
				</div>
				<Button onClick={() => router.push("/emails/new")} className="focus-ring">
					<Plus className="mr-2 h-4 w-4" />
					Create Email
				</Button>
			</div>

			{/* Data Table */}
			{isLoading ? (
				<div className="space-y-4">
					{[...Array(5)].map((_, i) => (
						<div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
					))}
				</div>
			) : data?.emails.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="p-4 rounded-full bg-muted/50 mb-4">
						<Mail className="h-8 w-8 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-semibold mb-2">No emails found</h3>
					<p className="text-muted-foreground mb-4">
						{activeTab === "all"
							? "Get started by creating your first email campaign"
							: `No emails with status "${activeTab.toLowerCase()}" found`
						}
					</p>
					<Button onClick={() => router.push("/emails/new")}>
						<Plus className="mr-2 h-4 w-4" />
						Create Your First Email
					</Button>
				</div>
			) : (
				<DataTable
					columns={columns}
					data={data?.emails || []}
					searchKey="subject"
					searchPlaceholder="Search emails..."
					pageSize={10}
				/>
			)}
		</div>
	);
}

