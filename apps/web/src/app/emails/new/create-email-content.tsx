"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { client } from "@/utils/orpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CsvUploader } from "@/components/csv-uploader";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

export function CreateEmailContent() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

	const [singleForm, setSingleForm] = useState({
		subject: "",
		recipientEmail: "",
		recipientName: "",
		htmlBody: "",
		textBody: "",
		scheduledFor: "",
	});

	const [bulkForm, setBulkForm] = useState({
		subject: "",
		htmlBody: "",
		textBody: "",
		scheduledFor: "",
		csvData: "",
		csvFileName: "",
	});

	const createSingleMutation = useMutation({
		mutationFn: async () => {
			return await client.emails.createEmail(singleForm);
		},
		onSuccess: () => {
			toast.success("Email scheduled successfully!");
			router.push("/emails");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to schedule email");
		},
	});

	const createBulkMutation = useMutation({
		mutationFn: async () => {
			return await client.emails.createBulkEmail({
				subject: bulkForm.subject,
				htmlBody: bulkForm.htmlBody,
				textBody: bulkForm.textBody,
				scheduledFor: bulkForm.scheduledFor,
				csvData: bulkForm.csvData,
			});
		},
		onSuccess: (data) => {
			toast.success(
				`Bulk email scheduled! ${data.summary.valid} recipients added${data.summary.invalid > 0 ? `, ${data.summary.invalid} invalid` : ""}`
			);
			router.push("/emails");
		},
		onError: (error) => {
			toast.error(error.message || "Failed to schedule bulk email");
		},
	});

	const handleSingleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createSingleMutation.mutate();
	};

	const handleBulkSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!bulkForm.csvData) {
			toast.error("Please upload a CSV file");
			return;
		}
		createBulkMutation.mutate();
	};

	return (
		<div className="space-y-6">
			<div className="flex gap-4 border-b">
				<button
					onClick={() => setActiveTab("single")}
					className={`px-4 py-2 font-medium transition-colors ${
						activeTab === "single"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Single Email
				</button>
				<button
					onClick={() => setActiveTab("bulk")}
					className={`px-4 py-2 font-medium transition-colors ${
						activeTab === "bulk"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
				>
					Bulk Upload
				</button>
			</div>

			{activeTab === "single" ? (
				<form onSubmit={handleSingleSubmit} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Email Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="subject">Subject *</Label>
								<Input
									id="subject"
									value={singleForm.subject}
									onChange={(e) =>
										setSingleForm({ ...singleForm, subject: e.target.value })
									}
									maxLength={255}
									required
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="recipientEmail">Recipient Email *</Label>
									<Input
										id="recipientEmail"
										type="email"
										value={singleForm.recipientEmail}
										onChange={(e) =>
											setSingleForm({
												...singleForm,
												recipientEmail: e.target.value,
											})
										}
										required
									/>
								</div>
								<div>
									<Label htmlFor="recipientName">Recipient Name</Label>
									<Input
										id="recipientName"
										value={singleForm.recipientName}
										onChange={(e) =>
											setSingleForm({
												...singleForm,
												recipientName: e.target.value,
											})
										}
									/>
								</div>
							</div>

							<div>
								<Label htmlFor="htmlBody">Email Body (HTML) *</Label>
								<textarea
									id="htmlBody"
									value={singleForm.htmlBody}
									onChange={(e) =>
										setSingleForm({ ...singleForm, htmlBody: e.target.value })
									}
									className="w-full min-h-[200px] p-3 border rounded-md"
									required
								/>
								<p className="text-xs text-muted-foreground mt-1">
									You can use HTML tags for formatting
								</p>
							</div>

							<div>
								<Label htmlFor="textBody">Plain Text Version</Label>
								<textarea
									id="textBody"
									value={singleForm.textBody}
									onChange={(e) =>
										setSingleForm({ ...singleForm, textBody: e.target.value })
									}
									className="w-full min-h-[100px] p-3 border rounded-md"
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Optional fallback for email clients that don't support HTML
								</p>
							</div>

							<div>
								<Label htmlFor="scheduledFor">Schedule For</Label>
								<Input
									id="scheduledFor"
									type="datetime-local"
									value={singleForm.scheduledFor}
									onChange={(e) =>
										setSingleForm({
											...singleForm,
											scheduledFor: e.target.value,
										})
									}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Leave empty to send immediately
								</p>
							</div>
						</CardContent>
					</Card>

					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={createSingleMutation.isPending}
						>
							{createSingleMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Scheduling...
								</>
							) : (
								<>
									<Send className="mr-2 h-4 w-4" />
									Schedule Email
								</>
							)}
						</Button>
					</div>
				</form>
			) : (
				<form onSubmit={handleBulkSubmit} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Bulk Email Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<Label htmlFor="bulk-subject">Subject *</Label>
								<Input
									id="bulk-subject"
									value={bulkForm.subject}
									onChange={(e) =>
										setBulkForm({ ...bulkForm, subject: e.target.value })
									}
									maxLength={255}
									required
								/>
							</div>

							<div>
								<Label htmlFor="bulk-htmlBody">Email Body (HTML) *</Label>
								<textarea
									id="bulk-htmlBody"
									value={bulkForm.htmlBody}
									onChange={(e) =>
										setBulkForm({ ...bulkForm, htmlBody: e.target.value })
									}
									className="w-full min-h-[200px] p-3 border rounded-md"
									required
								/>
							</div>

							<div>
								<Label htmlFor="bulk-textBody">Plain Text Version</Label>
								<textarea
									id="bulk-textBody"
									value={bulkForm.textBody}
									onChange={(e) =>
										setBulkForm({ ...bulkForm, textBody: e.target.value })
									}
									className="w-full min-h-[100px] p-3 border rounded-md"
								/>
							</div>

							<div>
								<Label htmlFor="bulk-scheduledFor">Schedule For</Label>
								<Input
									id="bulk-scheduledFor"
									type="datetime-local"
									value={bulkForm.scheduledFor}
									onChange={(e) =>
										setBulkForm({ ...bulkForm, scheduledFor: e.target.value })
									}
								/>
								<p className="text-xs text-muted-foreground mt-1">
									Leave empty to send immediately
								</p>
							</div>
						</CardContent>
					</Card>

					<div>
						<Label>Recipients CSV File *</Label>
						<div className="mt-2">
							<CsvUploader
								onFileSelect={(content) =>
									setBulkForm({ ...bulkForm, csvData: content, csvFileName: "recipients.csv" })
								}
								onClear={() =>
									setBulkForm({ ...bulkForm, csvData: "", csvFileName: "" })
								}
								fileName={bulkForm.csvFileName}
							/>
						</div>
					</div>

					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={createBulkMutation.isPending}
						>
							{createBulkMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Scheduling...
								</>
							) : (
								<>
									<Send className="mr-2 h-4 w-4" />
									Schedule Bulk Email
								</>
							)}
						</Button>
					</div>
				</form>
			)}
		</div>
	);
}

