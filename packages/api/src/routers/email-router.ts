import { z } from "zod";
import { protectedProcedure } from "../index";
import prisma from "@orpc-better-t-stack/db";
import { processBulkCsv, retryFailedEmail } from "@orpc-better-t-stack/email-service";
import { format } from "date-fns";

const createEmailSchema = z.object({
	subject: z.string().min(1, "Subject is required").max(255, "Subject must be 255 characters or less"),
	htmlBody: z.string().min(1, "Email body is required"),
	textBody: z.string().optional(),
	recipientEmail: z.string().email("Invalid email address"),
	recipientName: z.string().optional(),
	scheduledFor: z.string().optional(),
});

const createBulkEmailSchema = z.object({
	subject: z.string().min(1, "Subject is required").max(255),
	htmlBody: z.string().min(1, "Email body is required"),
	textBody: z.string().optional(),
	scheduledFor: z.string().optional(),
	csvData: z.string().min(1, "CSV data is required"),
});

const getEmailsSchema = z
	.object({
		page: z.number().min(1).optional().default(1),
		limit: z.number().min(1).max(100).optional().default(20),
		status: z.enum(["SCHEDULED", "SENDING", "SENT", "FAILED", "CANCELLED"]).optional(),
		search: z.string().min(1).optional(),
	})
	.optional()
	.default({ page: 1, limit: 20 });

const emailIdSchema = z.object({
	id: z.string().min(1, "Email ID is required"),
});

const updateEmailSchema = z.object({
	id: z.string().min(1, "Email ID is required"),
	subject: z.string().min(1).max(255).optional(),
	htmlBody: z.string().optional(),
	textBody: z.string().optional(),
	scheduledFor: z.string().optional(),
});

const getStatsSchema = z
	.object({
		timeRange: z.enum(["today", "week", "month", "all"]).default("all"),
	})
	.default({ timeRange: "all" });


// Simple function to store exact time selected - NO CONVERSIONS
function storeExactTime(datetimeLocalString: string): Date {
	console.log("🔍 storeExactTime - Input:", datetimeLocalString);

	// datetime-local format: "YYYY-MM-DDTHH:mm"
	// Parse the components exactly as provided
	const [datePart, timePart] = datetimeLocalString.split('T');
	if (!datePart || !timePart) {
		throw new Error("Invalid datetime-local format");
	}

	const [year, month, day] = datePart.split('-').map(Number);
	const [hours, minutes] = timePart.split(':').map(Number);

	// Validate all components are numbers
	if (year === undefined || month === undefined || day === undefined ||
		hours === undefined || minutes === undefined ||
		isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
		throw new Error("Invalid datetime components");
	}

	// Create date with EXACT components - no timezone conversion
	// This will store the exact time you selected
	const exactDate = new Date(year, month - 1, day, hours, minutes);

	console.log("🔍 storeExactTime - EXACT components:", { year, month, day, hours, minutes });
	console.log("🔍 storeExactTime - EXACT date:", exactDate.toString());
	console.log("🔍 storeExactTime - EXACT ISO:", exactDate.toISOString());

	return exactDate;
}


export const emailRouter = {
	createEmail: protectedProcedure
		.input(createEmailSchema)
		.handler(async ({ context, input }) => {
			// Handle datetime-local input properly
			let scheduledFor = new Date();
			const currentTime = new Date();

			console.log("🕐 CURRENT TIME DEBUG:");
			console.log("  - Current time:", currentTime.toString());
			console.log("  - Current time ISO:", currentTime.toISOString());
			console.log("  - Current time getTime():", currentTime.getTime());
			console.log("  - Timezone offset (minutes):", currentTime.getTimezoneOffset());

			if (input.scheduledFor) {
				console.log("📅 SCHEDULED DATE DEBUG:");
				console.log("  - Input scheduledFor:", input.scheduledFor);

				try {
					scheduledFor = storeExactTime(input.scheduledFor);

					console.log("  - FINAL scheduledFor:", scheduledFor.toString());
					console.log("  - FINAL scheduledFor ISO:", scheduledFor.toISOString());
					console.log("  - FINAL scheduledFor getTime():", scheduledFor.getTime());
					console.log("  - Time difference (ms):", scheduledFor.getTime() - currentTime.getTime());
					console.log("  - Time difference (hours):", (scheduledFor.getTime() - currentTime.getTime()) / (1000 * 60 * 60));
					console.log("  - Formatted display:", format(scheduledFor, "PPP 'at' p"));
				} catch (error) {
					console.error("❌ Date parsing error:", error);
					throw new Error(`Invalid datetime format: ${input.scheduledFor}`);
				}
			} else {
				console.log("📅 SCHEDULED DATE DEBUG: No scheduled time provided, using current time");
			}

			const email = await prisma.email.create({
				data: {
					userId: context.session.user.id,
					subject: input.subject,
					htmlBody: input.htmlBody,
					textBody: input.textBody,
					scheduledFor,
					status: "SCHEDULED",
					recipients: {
						create: {
							recipientEmail: input.recipientEmail,
							recipientName: input.recipientName,
						},
					},
				},
				include: {
					recipients: true,
				},
			});

			return email;
		}),

	createBulkEmail: protectedProcedure
		.input(createBulkEmailSchema)
		.handler(async ({ context, input }) => {
			const bulkResult = processBulkCsv(input.csvData);

			if (bulkResult.valid.length === 0) {
				throw new Error("No valid email addresses found in CSV");
			}

			// Handle datetime-local input properly
			let scheduledFor = new Date();
			if (input.scheduledFor) {
				try {
					scheduledFor = storeExactTime(input.scheduledFor);
				} catch (error) {
					console.error("❌ Bulk email date parsing error:", error);
					throw new Error(`Invalid datetime format: ${input.scheduledFor}`);
				}
			}

			const email = await prisma.email.create({
				data: {
					userId: context.session.user.id,
					subject: input.subject,
					htmlBody: input.htmlBody,
					textBody: input.textBody,
					scheduledFor,
					status: "SCHEDULED",
					recipients: {
						create: bulkResult.valid.map((recipient) => ({
							recipientEmail: recipient.email,
							recipientName: recipient.name,
						})),
					},
				},
				include: {
					recipients: true,
				},
			});

			return {
				email,
				summary: {
					total: bulkResult.total,
					valid: bulkResult.valid.length,
					invalid: bulkResult.invalid.length,
					errors: bulkResult.invalid,
				},
			};
		}),

	getEmails: protectedProcedure
		.input(getEmailsSchema)
		.handler(async ({ context, input }) => {
			const skip = (input.page - 1) * input.limit;

			const where = {
				userId: context.session.user.id,
				...(input.status && { status: input.status }),
				...(input.search && {
					OR: [
						{ subject: { contains: input.search, mode: "insensitive" as const } },
						{ recipients: { some: { recipientEmail: { contains: input.search, mode: "insensitive" as const } } } },
					],
				}),
			};

			const [emails, total] = await Promise.all([
				prisma.email.findMany({
					where,
					include: {
						recipients: {
							select: {
								id: true,
								recipientEmail: true,
								recipientName: true,
								status: true,
							},
						},
					},
					orderBy: { scheduledFor: "desc" },
					skip,
					take: input.limit,
				}),
				prisma.email.count({ where }),
			]);


			// Debug: Log the scheduledFor values being returned
			console.log("🔍 getEmails - Returning emails with scheduledFor values:");
			emails.forEach((email, index) => {
				console.log(`  Email ${index + 1} (${email.subject}):`, {
					scheduledFor: email.scheduledFor,
					scheduledForType: typeof email.scheduledFor,
					scheduledForString: email.scheduledFor.toString(),
					scheduledForISO: email.scheduledFor.toISOString(),
				});
			});

			return {
				emails,
				pagination: {
					page: input.page,
					limit: input.limit,
					total,
					pages: Math.ceil(total / input.limit),
				},
			};
		}),

	getEmailById: protectedProcedure
		.input(emailIdSchema)
		.handler(async ({ context, input }) => {
			const email = await prisma.email.findUnique({
				where: { id: input.id },
				include: {
					recipients: {
						include: {
							events: {
								orderBy: { createdAt: "desc" },
							},
						},
					},
				},
			});

			if (!email) {
				throw new Error("Email not found");
			}

			if (email.userId !== context.session.user.id) {
				throw new Error("Unauthorized");
			}

			return email;
		}),

	updateEmail: protectedProcedure
		.input(updateEmailSchema)
		.handler(async ({ context, input }) => {
			const existingEmail = await prisma.email.findUnique({
				where: { id: input.id },
			});

			if (!existingEmail) {
				throw new Error("Email not found");
			}

			if (existingEmail.userId !== context.session.user.id) {
				throw new Error("Unauthorized");
			}

			if (existingEmail.status !== "SCHEDULED") {
				throw new Error("Only scheduled emails can be updated");
			}

			// Handle datetime-local input properly for updates
			let scheduledFor = undefined;
			if (input.scheduledFor) {
				try {
					scheduledFor = storeExactTime(input.scheduledFor);
				} catch (error) {
					console.error("❌ Update email date parsing error:", error);
					throw new Error(`Invalid datetime format: ${input.scheduledFor}`);
				}
			}

			const email = await prisma.email.update({
				where: { id: input.id },
				data: {
					...(input.subject && { subject: input.subject }),
					...(input.htmlBody && { htmlBody: input.htmlBody }),
					...(input.textBody !== undefined && { textBody: input.textBody }),
					...(scheduledFor && { scheduledFor }),
				},
				include: {
					recipients: true,
				},
			});

			return email;
		}),

	cancelEmail: protectedProcedure
		.input(emailIdSchema)
		.handler(async ({ context, input }) => {
			const existingEmail = await prisma.email.findUnique({
				where: { id: input.id },
			});

			if (!existingEmail) {
				throw new Error("Email not found");
			}

			if (existingEmail.userId !== context.session.user.id) {
				throw new Error("Unauthorized");
			}

			if (existingEmail.status !== "SCHEDULED") {
				throw new Error("Only scheduled emails can be cancelled");
			}

			const email = await prisma.email.update({
				where: { id: input.id },
				data: { status: "CANCELLED" },
			});

			return email;
		}),

	getEmailStats: protectedProcedure
		.input(getStatsSchema)
		.handler(async ({ context, input }) => {
			const userId = context.session.user.id;

			let dateFilter: Date | undefined;
			const now = new Date();

			switch (input.timeRange) {
				case "today":
					dateFilter = new Date(now.setHours(0, 0, 0, 0));
					break;
				case "week":
					dateFilter = new Date(now.setDate(now.getDate() - 7));
					break;
				case "month":
					dateFilter = new Date(now.setMonth(now.getMonth() - 1));
					break;
			}

			const where = {
				userId,
				...(dateFilter && { createdAt: { gte: dateFilter } }),
			};

			const [totalEmails, scheduledCount, sentCount, failedCount, recipientStats] = await Promise.all([
				prisma.email.count({ where }),
				prisma.email.count({ where: { ...where, status: "SCHEDULED" } }),
				prisma.email.count({ where: { ...where, status: "SENT" } }),
				prisma.email.count({ where: { ...where, status: "FAILED" } }),
				prisma.emailRecipient.groupBy({
					by: ["status"],
					where: {
						email: where,
					},
					_count: true,
				}),
			]);

			const recipientStatusCounts = recipientStats.reduce((acc: Record<string, number>, stat: any) => {
				acc[stat.status] = stat._count;
				return acc;
			}, {} as Record<string, number>);

			const totalRecipients: number = (Object.values(recipientStatusCounts) as number[]).reduce((sum: number, count: number) => sum + count, 0);
			const deliveredCount: number = (recipientStatusCounts as any).DELIVERED || 0;
			const openedCount: number = (recipientStatusCounts as any).OPENED || 0;
			const bouncedCount: number = (recipientStatusCounts as any).BOUNCED || 0;

			return {
				totalEmails,
				scheduled: scheduledCount,
				sent: sentCount,
				failed: failedCount,
				totalRecipients,
				delivered: deliveredCount,
				opened: openedCount,
				bounced: bouncedCount,
				deliveryRate: totalRecipients > 0 ? Math.round((deliveredCount / totalRecipients) * 100) : 0,
				openRate: deliveredCount > 0 ? Math.round((openedCount / deliveredCount) * 100) : 0,
				bounceRate: totalRecipients > 0 ? Math.round((bouncedCount / totalRecipients) * 100) : 0,
			};
		}),

	retryFailedEmail: protectedProcedure
		.input(emailIdSchema)
		.handler(async ({ context, input }) => {
			const existingEmail = await prisma.email.findUnique({
				where: { id: input.id },
			});

			if (!existingEmail) {
				throw new Error("Email not found");
			}

			if (existingEmail.userId !== context.session.user.id) {
				throw new Error("Unauthorized");
			}

			await retryFailedEmail(input.id);

			return { success: true };
		}),
};

