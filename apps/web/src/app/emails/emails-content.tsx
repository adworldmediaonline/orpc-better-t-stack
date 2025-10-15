"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orpc } from "@/utils/orpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailListItem } from "@/components/email-list-item";
import { Plus, Search } from "lucide-react";

type EmailStatus = "SCHEDULED" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";

export function EmailsContent() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"all" | EmailStatus>("all");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);

	const statusFilter: EmailStatus | undefined = activeTab === "all" ? undefined : activeTab;

	const queryParams = {
		page,
		limit: 20,
		...(statusFilter && { status: statusFilter }),
		...(search && { search }),
	};

	const { data, isLoading, error } = useQuery(
		orpc.emails.getEmails.queryOptions(queryParams)
	);

	const tabs = [
		{ key: "all" as const, label: "All Emails" },
		{ key: "SCHEDULED" as const, label: "Scheduled" },
		{ key: "SENT" as const, label: "Sent" },
		{ key: "FAILED" as const, label: "Failed" },
	];

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center gap-4">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search by subject or recipient..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Button onClick={() => router.push("/emails/new")}>
					<Plus className="mr-2 h-4 w-4" />
					Create Email
				</Button>
			</div>

			<div className="flex gap-4 border-b">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => {
							setActiveTab(tab.key);
							setPage(1);
						}}
						className={`px-4 py-2 font-medium transition-colors ${
							activeTab === tab.key
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{error && (
				<Card>
					<CardContent className="py-8 text-center text-destructive">
						Error loading emails: {error.message}
					</CardContent>
				</Card>
			)}

			{isLoading && (
				<div className="space-y-3">
					{[...Array(5)].map((_, i) => (
						<Card key={i}>
							<CardContent className="p-6">
								<div className="space-y-3">
									<Skeleton className="h-5 w-1/3" />
									<Skeleton className="h-4 w-2/3" />
									<div className="flex gap-2">
										<Skeleton className="h-6 w-20" />
										<Skeleton className="h-6 w-24" />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{!isLoading && !error && data && (
				<>
					{data.emails.length === 0 ? (
						<Card>
							<CardContent className="py-12 text-center">
								<p className="text-muted-foreground mb-4">
									No emails found
								</p>
								<Button onClick={() => router.push("/emails/new")}>
									<Plus className="mr-2 h-4 w-4" />
									Create Your First Email
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-3">
							{data.emails.map((email) => (
								<EmailListItem
									key={email.id}
									email={email}
									onClick={() => router.push(`/emails/${email.id}`)}
								/>
							))}
						</div>
					)}

					{data.pagination.pages > 1 && (
						<div className="flex justify-center gap-2 mt-6">
							<Button
								variant="outline"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								Previous
							</Button>
							<div className="flex items-center px-4">
								Page {page} of {data.pagination.pages}
							</div>
							<Button
								variant="outline"
								onClick={() => setPage((p) => p + 1)}
								disabled={page >= data.pagination.pages}
							>
								Next
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}

