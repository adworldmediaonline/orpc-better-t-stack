import { parse } from "csv-parse/sync";
import { z } from "zod";

const emailSchema = z.string().email();

export interface BulkRecipient {
	email: string;
	name?: string;
}

export interface BulkProcessResult {
	total: number;
	valid: BulkRecipient[];
	invalid: Array<{ row: number; email: string; error: string }>;
}

export function processBulkCsv(csvContent: string): BulkProcessResult {
	const result: BulkProcessResult = {
		total: 0,
		valid: [],
		invalid: [],
	};

	try {
		const records = parse(csvContent, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
		});

		result.total = records.length;

		for (let i = 0; i < records.length; i++) {
			const record = records[i];
			const rowNumber = i + 2;

			const email = record.email || record.Email || record.EMAIL;
			const name = record.name || record.Name || record.NAME || undefined;

			if (!email) {
				result.invalid.push({
					row: rowNumber,
					email: "",
					error: "Email field is missing",
				});
				continue;
			}

			const validation = emailSchema.safeParse(email);
			if (!validation.success) {
				result.invalid.push({
					row: rowNumber,
					email,
					error: "Invalid email format",
				});
				continue;
			}

			result.valid.push({
				email: validation.data,
				name,
			});
		}
	} catch (error) {
		throw new Error(`CSV parsing error: ${error instanceof Error ? error.message : "Unknown error"}`);
	}

	return result;
}

export function validateBulkRecipients(recipients: BulkRecipient[]): { valid: BulkRecipient[]; invalid: Array<{ email: string; error: string }> } {
	const valid: BulkRecipient[] = [];
	const invalid: Array<{ email: string; error: string }> = [];

	for (const recipient of recipients) {
		const validation = emailSchema.safeParse(recipient.email);
		if (validation.success) {
			valid.push(recipient);
		} else {
			invalid.push({
				email: recipient.email,
				error: "Invalid email format",
			});
		}
	}

	return { valid, invalid };
}

