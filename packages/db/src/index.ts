import { config } from "dotenv";
import { PrismaClient } from "../prisma/generated/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Load environment variables from the web app's .env file
// This ensures PRISMA_ACCELERATE_API_KEY is available if set
config({ path: "../../apps/web/.env" });

// Make Prisma Accelerate optional - only use it if API key is provided
// This prevents errors when Accelerate is not configured
const prismaClient = new PrismaClient();

const prisma = process.env.PRISMA_ACCELERATE_API_KEY
	? prismaClient.$extends(withAccelerate())
	: prismaClient;

export default prisma;
