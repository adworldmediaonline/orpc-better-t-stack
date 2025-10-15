import { Resend } from "resend";

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

