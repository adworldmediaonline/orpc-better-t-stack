import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@orpc-better-t-stack/auth";
import { CreateEmailContent } from "./create-email-content";

export default async function NewEmailPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Create New Email</h1>
				<p className="text-muted-foreground mt-2">
					Schedule a single email or upload a CSV for bulk sending
				</p>
			</div>
			<CreateEmailContent />
		</div>
	);
}

