import { redirect } from "next/navigation";
import Dashboard from "./dashboard";
import { headers } from "next/headers";
import { auth } from "@orpc-better-t-stack/auth";
// import { authClient } from "@/lib/auth-client";

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/login");
	}

	if (session.user.role !== "admin") {
		redirect("/");
	}

	return (
		<div className="container mx-auto max-w-7xl px-4 py-8">
			<Dashboard session={session} />
		</div>
	);
}
