import { config } from "dotenv";
import { PrismaClient } from "../prisma/generated/client";
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

// Check DATABASE_URL to see if it's an Accelerate connection string
// Accelerate connection strings can be:
// - prisma:// (direct Accelerate)
// - prisma+postgres:// (Accelerate with PostgreSQL)
const databaseUrl = process.env.DATABASE_URL || "";
const isAccelerateConnectionString =
	databaseUrl.startsWith("prisma://") ||
	databaseUrl.startsWith("prisma+postgres://");

// Check if Accelerate API key is set and not empty
const accelerateApiKey = process.env.PRISMA_ACCELERATE_API_KEY;
const hasAccelerateApiKey =
	accelerateApiKey &&
	accelerateApiKey.trim().length > 0 &&
	accelerateApiKey !== "undefined" &&
	accelerateApiKey !== "null";

// Determine if we should use Accelerate extension
// If DATABASE_URL is prisma://, Accelerate is required (API key should be in connection string)
// If DATABASE_URL is regular postgres://, we can optionally use Accelerate with API key
const shouldUseAccelerate = hasAccelerateApiKey && !isAccelerateConnectionString;

// Log detailed information for debugging
console.log("🔍 Prisma Configuration Debug:");
console.log("  - DATABASE_URL type:", isAccelerateConnectionString ? "Accelerate (prisma:// or prisma+postgres://)" : "Regular PostgreSQL");
console.log("  - DATABASE_URL preview:", databaseUrl.substring(0, 30) + (databaseUrl.length > 30 ? "..." : ""));
console.log("  - PRISMA_ACCELERATE_API_KEY exists:", hasAccelerateApiKey);
console.log("  - PRISMA_ACCELERATE_API_KEY preview:", hasAccelerateApiKey ? accelerateApiKey.substring(0, 15) + "..." : "not set");
console.log("  - Using Accelerate extension:", shouldUseAccelerate);
console.log("  - NODE_ENV:", process.env.NODE_ENV);

if (isAccelerateConnectionString) {
	console.log("  ⚠️  DATABASE_URL is an Accelerate connection string");
	console.log("  ℹ️  When using prisma:// or prisma+postgres:// connection, Accelerate is built-in");
	console.log("  ℹ️  Do NOT use withAccelerate() extension - it's already enabled via connection string");
	console.log("  ℹ️  The PRISMA_ACCELERATE_API_KEY env var should be embedded in the connection string");
}

// Conditionally apply Accelerate extension, but always return as PrismaClient type
// This ensures TypeScript compatibility while allowing optional Accelerate
const prisma = (shouldUseAccelerate
	? prismaClient.$extends(withAccelerate())
	: prismaClient) as PrismaClient;

console.log(
	shouldUseAccelerate
		? "✅ Prisma Accelerate extension enabled"
		: isAccelerateConnectionString
			? "ℹ️  Using Accelerate via connection string (prisma://)"
			: "ℹ️  Using standard Prisma Client (no Accelerate)"
);

export default prisma;
