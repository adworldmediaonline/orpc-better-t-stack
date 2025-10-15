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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

// Form schemas
const singleEmailSchema = z.object({
	subject: z.string().min(1, "Subject is required").max(255, "Subject must be 255 characters or less"),
	recipientEmail: z.string().email("Invalid email address"),
	recipientName: z.string().optional(),
	htmlBody: z.string().min(1, "Email body is required"),
	textBody: z.string().optional(),
	scheduledFor: z.string().optional(),
});

const bulkEmailSchema = z.object({
	subject: z.string().min(1, "Subject is required").max(255, "Subject must be 255 characters or less"),
	htmlBody: z.string().min(1, "Email body is required"),
	textBody: z.string().optional(),
	scheduledFor: z.string().optional(),
	csvData: z.string().min(1, "CSV file is required"),
});

type SingleEmailForm = z.infer<typeof singleEmailSchema>;
type BulkEmailForm = z.infer<typeof bulkEmailSchema>;

export function CreateEmailContent() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

	// Single email form
	const singleForm = useForm<SingleEmailForm>({
		resolver: zodResolver(singleEmailSchema),
		defaultValues: {
			subject: "",
			recipientEmail: "",
			recipientName: "",
			htmlBody: "",
			textBody: "",
			scheduledFor: "",
		},
	});

	// Bulk email form
	const bulkForm = useForm<BulkEmailForm>({
		resolver: zodResolver(bulkEmailSchema),
		defaultValues: {
			subject: "",
			htmlBody: "",
			textBody: "",
			scheduledFor: "",
			csvData: "",
		},
	});

	const createSingleMutation = useMutation({
		mutationFn: async (data: SingleEmailForm) => {
			return await client.emails.createEmail(data);
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
		mutationFn: async (data: BulkEmailForm) => {
			return await client.emails.createBulkEmail(data);
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

	const onSingleSubmit = (data: SingleEmailForm) => {
		createSingleMutation.mutate(data);
	};

	const onBulkSubmit = (data: BulkEmailForm) => {
		createBulkMutation.mutate(data);
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
				<Form {...singleForm}>
					<form onSubmit={singleForm.handleSubmit(onSingleSubmit)} className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Email Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={singleForm.control}
									name="subject"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Subject *</FormLabel>
											<FormControl>
												<Input placeholder="Enter email subject" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={singleForm.control}
										name="recipientEmail"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Recipient Email *</FormLabel>
												<FormControl>
													<Input type="email" placeholder="recipient@example.com" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={singleForm.control}
										name="recipientName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Recipient Name</FormLabel>
												<FormControl>
													<Input placeholder="John Doe" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={singleForm.control}
									name="htmlBody"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email Body (HTML) *</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Enter your email content..."
													className="min-h-[200px]"
													{...field}
												/>
											</FormControl>
											<p className="text-xs text-muted-foreground">
												You can use HTML tags for formatting
											</p>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={singleForm.control}
									name="textBody"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Plain Text Version</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Plain text version..."
													className="min-h-[100px]"
													{...field}
												/>
											</FormControl>
											<p className="text-xs text-muted-foreground">
												Optional fallback for email clients that don't support HTML
											</p>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={singleForm.control}
									name="scheduledFor"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Schedule For</FormLabel>
											<FormControl>
												<Input type="datetime-local" {...field} />
											</FormControl>
											<p className="text-xs text-muted-foreground">
												Leave empty to send immediately
											</p>
											<FormMessage />
										</FormItem>
									)}
								/>
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
				</Form>
			) : (
				<Form {...bulkForm}>
					<form onSubmit={bulkForm.handleSubmit(onBulkSubmit)} className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Bulk Email Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<FormField
									control={bulkForm.control}
									name="subject"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Subject *</FormLabel>
											<FormControl>
												<Input placeholder="Enter email subject" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={bulkForm.control}
									name="htmlBody"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email Body (HTML) *</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Enter your email content..."
													className="min-h-[200px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={bulkForm.control}
									name="textBody"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Plain Text Version</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Plain text version..."
													className="min-h-[100px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={bulkForm.control}
									name="scheduledFor"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Schedule For</FormLabel>
											<FormControl>
												<Input type="datetime-local" {...field} />
											</FormControl>
											<p className="text-xs text-muted-foreground">
												Leave empty to send immediately
											</p>
											<FormMessage />
										</FormItem>
									)}
								/>
							</CardContent>
						</Card>

						<FormField
							control={bulkForm.control}
							name="csvData"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Recipients CSV File *</FormLabel>
									<FormControl>
										<CsvUploader
											onFileSelect={(content) => {
												field.onChange(content);
											}}
											onClear={() => field.onChange("")}
											fileName={field.value ? "recipients.csv" : ""}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

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
				</Form>
			)}
		</div>
	);
}

