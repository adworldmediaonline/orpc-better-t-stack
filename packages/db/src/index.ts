import { config } from "dotenv";
import { PrismaClient } from "../prisma/generated/client";
export * from "../prisma/generated/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Load environment variables from the web app's .env file (for local development)
// In production (Vercel), environment variables are set directly
try {
	config({ path: "../../apps/web/.env" });
} catch {
	// Ignore if .env file doesn't exist (e.g., in production)
}

// Make Prisma Accelerate optional - only use it if API key is provided and valid
// This prevents errors when Accelerate is not configured or has invalid key
const prismaClient = new PrismaClient();

// Check if Accelerate API key is set and not empty
// IMPORTANT: In Vercel, if you don't have a valid Prisma Accelerate API key,
// make sure PRISMA_ACCELERATE_API_KEY is either:
// 1. Not set at all, OR
// 2. Set to an empty string ""
// Setting it to an invalid value will cause errors
const accelerateApiKey = process.env.PRISMA_ACCELERATE_API_KEY;
const shouldUseAccelerate =
	accelerateApiKey &&
	accelerateApiKey.trim().length > 0 &&
	accelerateApiKey !== "undefined" &&
	accelerateApiKey !== "null";

// Conditionally apply Accelerate extension, but always return as PrismaClient type
// This ensures TypeScript compatibility while allowing optional Accelerate
const prisma = (shouldUseAccelerate
	? prismaClient.$extends(withAccelerate())
	: prismaClient) as PrismaClient;

// Log Accelerate status for debugging (only in development)
if (process.env.NODE_ENV === "development") {
	console.log(
		shouldUseAccelerate
			? "✅ Prisma Accelerate enabled"
			: "ℹ️  Prisma Accelerate disabled (using standard Prisma Client)"
	);
}

export default prisma;
