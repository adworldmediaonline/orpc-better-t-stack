import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@orpc-better-t-stack/auth";
import { EmailsContent } from "./emails-content";

export default async function EmailsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Emails</h1>
				<p className="text-muted-foreground mt-2">
					Manage and track your email campaigns
				</p>
			</div>
			<EmailsContent />
		</div>
	);
}

