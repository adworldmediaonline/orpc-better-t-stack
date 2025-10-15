import { Resend } from "resend";
import { config } from "dotenv";

// Load environment variables from the web app's .env file
config({ path: "../../apps/web/.env" });

let resendInstance: Resend | null = null;

export const resend = new Proxy({} as Resend, {
	get(_target, prop) {
		if (!resendInstance) {
			const RESEND_API_KEY = process.env.RESEND_API_KEY;
			if (!RESEND_API_KEY) {
				throw new Error("RESEND_API_KEY environment variable is not set");
			}
			resendInstance = new Resend(RESEND_API_KEY);
		}
		return (resendInstance as any)[prop];
	},
});

