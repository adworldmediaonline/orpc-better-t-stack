"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orpc } from "@/utils/orpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Plus,
	Eye,
	Trash2,
	MoreHorizontal,
	Calendar,
	Users,
	Mail,
	Filter,
	ChevronDown,
	ArrowUpDown,
	Search,
	ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import type { ColumnDef, ColumnFiltersState, SortingState } from "@tanstack/react-table";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";

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
		deliveredAt: Date | null;
		openedAt: Date | null;
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
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [rowSelection, setRowSelection] = useState({});

	// Fetch all emails - we'll do filtering client-side with TanStack Table
	const { data, isLoading, error } = useQuery({
		...orpc.emails.getEmails.queryOptions({ page: 1, limit: 1000 }), // Get more emails for client-side filtering
		queryKey: ["emails"] as const,
		refetchInterval: 5000, // Auto-refresh every 5 seconds
	});

	const columns: ColumnDef<Email>[] = useMemo(
		() => [
			{
				id: "select",
				header: ({ table }) => (
					<Checkbox
						checked={
							table.getIsAllPageRowsSelected() ||
							(table.getIsSomePageRowsSelected() && "indeterminate")
						}
						onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
						aria-label="Select all"
						className="focus-ring"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label="Select row"
						className="focus-ring"
					/>
				),
				enableSorting: false,
				enableHiding: false,
			},
			{
				accessorKey: "subject",
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
							className="focus-ring"
						>
							Subject
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					);
				},
				cell: ({ row }) => {
					const email = row.original;
					return (
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-lg bg-primary/10">
								<Mail className="h-4 w-4 text-primary" />
							</div>
							<div>
								<div className="font-medium text-foreground">{email.subject}</div>
								{/* todo uncomment later */}
								{/* <div className="text-sm text-muted-foreground">
									Created {format(new Date(email.createdAt), "MMM d, yyyy")}
								</div> */}
							</div>
						</div>
					);
				},
			},
			{
				accessorKey: "status",
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
							className="focus-ring"
						>
							Status
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					);
				},
				cell: ({ row }) => {
					return getStatusBadge(row.getValue("status"));
				},
				filterFn: (row, id, value) => {
					return value.includes(row.getValue(id));
				},
			},
			{
				accessorKey: "scheduledFor",
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
							className="focus-ring"
						>
							Scheduled
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					);
				},
				cell: ({ row }) => {
					const date = new Date(row.getValue("scheduledFor"));
					// Display in local time
					const localDate = date;

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
				header: ({ column }) => {
					return (
						<Button
							variant="ghost"
							onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
							className="focus-ring"
						>
							Recipients
							<ArrowUpDown className="ml-2 h-4 w-4" />
						</Button>
					);
				},
				cell: ({ row }) => {
					const recipients = row.getValue("recipients") as Email["recipients"];

					if (recipients.length === 0) {
						return (
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm text-muted-foreground">No recipients</span>
							</div>
						);
					}

					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="h-auto p-2 hover:bg-muted/50 focus-ring">
									<div className="flex items-center gap-2">
										<Users className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium">{recipients.length}</span>
										<span className="text-sm text-muted-foreground">recipients</span>
										<ChevronRight className="h-3 w-3 text-muted-foreground" />
									</div>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="w-80 bg-card/95 backdrop-blur-md border-border/50">
								<DropdownMenuLabel className="flex items-center gap-2">
									<Mail className="h-4 w-4" />
									Recipients ({recipients.length})
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<ScrollArea className="h-48 w-full">
									<div className="space-y-1 pr-4">
										{recipients.map((recipient, index) => (
											<div
												key={recipient.id}
												className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
											>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2">
														<div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
														<div className="flex-1 min-w-0">
															<p className="text-sm font-medium text-foreground truncate">
																{recipient.recipientName || recipient.recipientEmail}
															</p>
															{recipient.recipientName && (
																<p className="text-xs text-muted-foreground truncate">
																	{recipient.recipientEmail}
																</p>
															)}
														</div>
													</div>
												</div>
												<div className="flex items-center gap-2 ml-2">
													<Badge
														variant="outline"
														className={`
															text-xs px-2 py-1 h-auto
															${recipient.status === 'DELIVERED'
																? 'bg-success/10 text-success border-success/20'
																: recipient.status === 'OPENED'
																	? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800'
																	: recipient.status === 'BOUNCED'
																		? 'bg-destructive/10 text-destructive border-destructive/20'
																		: 'bg-muted/10 text-muted-foreground border-muted/20'
															}
														`}
													>
														{recipient.status.toLowerCase()}
													</Badge>
													{recipient.deliveredAt && (
														<div className="text-xs text-muted-foreground">
															{format(new Date(recipient.deliveredAt), "MMM d, h:mm a")}
														</div>
													)}
												</div>
											</div>
										))}
									</div>
								</ScrollArea>
							</DropdownMenuContent>
						</DropdownMenu>
					);
				},
			},
			{
				id: "delivery",
				header: "Delivery Status",
				cell: ({ row }) => {
					const recipients = row.getValue("recipients") as Email["recipients"];

					// Calculate delivery metrics
					const totalRecipients = recipients.length;
					const deliveredCount = recipients.filter(r => r.deliveredAt).length;
					const openedCount = recipients.filter(r => r.openedAt).length;

					if (totalRecipients === 0) {
						return (
							<div className="text-sm text-muted-foreground">
								No recipients
							</div>
						);
					}

					return (
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<Badge
									variant="outline"
									className="bg-success/10 text-success border-success/20 text-xs"
								>
									{deliveredCount}/{totalRecipients} Delivered
								</Badge>
							</div>
							{openedCount > 0 && (
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-800 text-xs"
									>
										{openedCount}/{totalRecipients} Opened
									</Badge>
								</div>
							)}
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

	const table = useReactTable({
		data: (data?.emails || []) as any[],
		columns: columns as any,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			rowSelection,
		},
		initialState: {
			pagination: {
				pageSize: 10,
			},
		},
	});

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
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-end">

				<Button onClick={() => router.push("/emails/new")} className="focus-ring">
					<Plus className="mr-2 h-4 w-4" />
					Create Email
				</Button>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-4">
				<Input
					placeholder="Search emails..."
					value={(table.getColumn("subject")?.getFilterValue() as string) ?? ""}
					onChange={(event) =>
						table.getColumn("subject")?.setFilterValue(event.target.value)
					}
					className="max-w-sm focus-ring"
				/>

				{/* Status Filter */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="focus-ring">
							<Filter className="mr-2 h-4 w-4" />
							Status
							<ChevronDown className="ml-2 h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-md border-border/50">
						<DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{["SCHEDULED", "SENDING", "SENT", "FAILED", "CANCELLED"].map((status) => (
							<DropdownMenuCheckboxItem
								key={status}
								checked={(table.getColumn("status")?.getFilterValue() as string[])?.includes(status) || false}
								onCheckedChange={(value) => {
									const currentFilters = (table.getColumn("status")?.getFilterValue() as string[]) || [];
									if (value) {
										table.getColumn("status")?.setFilterValue([...currentFilters, status]);
									} else {
										table.getColumn("status")?.setFilterValue(
											currentFilters.filter((item) => item !== status)
										);
									}
								}}
							>
								{getStatusBadge(status as EmailStatus)}
							</DropdownMenuCheckboxItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => table.getColumn("status")?.setFilterValue(undefined)}
						>
							Clear Filters
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
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
						Get started by creating your first email campaign
					</p>
					<Button onClick={() => router.push("/emails/new")}>
						<Plus className="mr-2 h-4 w-4" />
						Create Your First Email
					</Button>
				</div>
			) : (
				<div className="w-full">
					<div className="rounded-md border border-border/50 bg-card/80 backdrop-blur-sm">
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => {
											return (
												<TableHead key={header.id}>
													{header.isPlaceholder
														? null
														: flexRender(
															header.column.columnDef.header,
															header.getContext()
														)}
												</TableHead>
											);
										})}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{table.getRowModel().rows?.length ? (
									table.getRowModel().rows.map((row) => (
										<TableRow
											key={row.id}
											data-state={row.getIsSelected() && "selected"}
										>
											{row.getVisibleCells().map((cell) => (
												<TableCell key={cell.id}>
													{flexRender(cell.column.columnDef.cell, cell.getContext())}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={columns.length} className="h-24 text-center">
											<div className="flex flex-col items-center justify-center py-8">
												<div className="p-4 rounded-full bg-muted/50 mb-4">
													<Search className="h-6 w-6 text-muted-foreground" />
												</div>
												<h3 className="text-lg font-semibold mb-2">No results found</h3>
												<p className="text-muted-foreground">
													Try adjusting your search or filter criteria
												</p>
											</div>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-end space-x-2 py-4">
						<div className="flex-1 text-sm text-muted-foreground">
							{table.getFilteredSelectedRowModel().rows.length} of{" "}
							{table.getFilteredRowModel().rows.length} row(s) selected.
						</div>
						<div className="space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
								className="focus-ring"
							>
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
								className="focus-ring"
							>
								Next
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

