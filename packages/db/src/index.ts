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

// Validate Accelerate connection string format
let connectionStringValid = true;
let connectionStringError = "";
if (isAccelerateConnectionString) {
	// Check if connection string contains api_key parameter
	if (!databaseUrl.includes("api_key=") && !databaseUrl.includes("?api_key=")) {
		connectionStringValid = false;
		connectionStringError = "Missing api_key parameter in Accelerate connection string";
	}
	// Check if api_key appears to be empty
	const apiKeyMatch = databaseUrl.match(/[?&]api_key=([^&]*)/);
	if (apiKeyMatch && (!apiKeyMatch[1] || apiKeyMatch[1].trim().length === 0)) {
		connectionStringValid = false;
		connectionStringError = "api_key parameter is empty in Accelerate connection string";
	}
}

// Check if Accelerate API key is set as separate environment variable
const accelerateApiKey = process.env.PRISMA_ACCELERATE_API_KEY;
const hasAccelerateApiKey =
	accelerateApiKey &&
	accelerateApiKey.trim().length > 0 &&
	accelerateApiKey !== "undefined" &&
	accelerateApiKey !== "null";

// Determine if we should use Accelerate extension
// CRITICAL: NEVER use withAccelerate() when DATABASE_URL is prisma:// or prisma+postgres://
// When using Accelerate connection strings, Accelerate is built-in and the extension is NOT needed
// Only use the extension for regular postgres:// connections with a separate API key
const shouldUseAccelerate = hasAccelerateApiKey && !isAccelerateConnectionString;

// Log detailed information for debugging (both development and production)
const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL;
const shouldLog = process.env.NODE_ENV === "development" || isProduction;

if (shouldLog) {
	console.log("🔍 Prisma Configuration Debug:");
	console.log("  - DATABASE_URL type:", isAccelerateConnectionString ? "Accelerate (prisma:// or prisma+postgres://)" : "Regular PostgreSQL");

	// Mask connection string for security (show only protocol and first few chars)
	const maskedUrl = isAccelerateConnectionString
		? databaseUrl.replace(/(api_key=)([^&]*)/, (_, prefix, key) => `${prefix}${key.substring(0, 8)}...${key.substring(key.length - 4)}`)
		: databaseUrl.substring(0, 30) + (databaseUrl.length > 30 ? "..." : "");
	console.log("  - DATABASE_URL preview:", maskedUrl);

	console.log("  - PRISMA_ACCELERATE_API_KEY exists:", hasAccelerateApiKey);
	if (hasAccelerateApiKey) {
		console.log("  - PRISMA_ACCELERATE_API_KEY preview:", accelerateApiKey.substring(0, 15) + "...");
	}
	console.log("  - Using Accelerate extension:", shouldUseAccelerate);
	console.log("  - NODE_ENV:", process.env.NODE_ENV);
	console.log("  - Environment:", isProduction ? "Production" : "Development");

	if (isAccelerateConnectionString) {
		if (!connectionStringValid) {
			console.error("  ❌ ERROR: Accelerate connection string validation failed");
			console.error("  ❌", connectionStringError);
			console.error("  ❌ This will cause Prisma Accelerate authentication errors!");
		} else {
			console.log("  ✅ Accelerate connection string format is valid");
		}
		console.log("  ℹ️  When using prisma:// or prisma+postgres:// connection, Accelerate is built-in");
		console.log("  ℹ️  Do NOT use withAccelerate() extension - it's already enabled via connection string");
		console.log("  ℹ️  The PRISMA_ACCELERATE_API_KEY env var should be embedded in the connection string");
	}
}

// Conditionally apply Accelerate extension, but always return as PrismaClient type
// This ensures TypeScript compatibility while allowing optional Accelerate
// IMPORTANT: We explicitly do NOT use withAccelerate() when using Accelerate connection strings
const prisma = (shouldUseAccelerate
	? prismaClient.$extends(withAccelerate())
	: prismaClient) as PrismaClient;

if (shouldLog) {
	console.log(
		shouldUseAccelerate
			? "✅ Prisma Accelerate extension enabled (for regular postgres:// connection)"
			: isAccelerateConnectionString
				? "ℹ️  Using Accelerate via connection string (prisma:// or prisma+postgres://) - extension NOT needed"
				: "ℹ️  Using standard Prisma Client (no Accelerate)"
	);
}

export default prisma;
