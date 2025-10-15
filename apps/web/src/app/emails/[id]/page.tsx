import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@orpc-better-t-stack/auth";
import { EmailDetailContent } from "./email-detail-content";

interface EmailDetailPageProps {
	params: Promise<{ id: string }>;
}

export default async function EmailDetailPage({ params }: EmailDetailPageProps) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/login");
	}

	const { id } = await params;

	return (
		<div className="container mx-auto max-w-6xl px-4 py-8">
			<EmailDetailContent emailId={id} />
		</div>
	);
}

