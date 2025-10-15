"use client";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orpc } from "@/utils/orpc";
import { EmailStatsCard } from "@/components/email-stats-card";
import { Mail, Send, CheckCircle2, Eye, Clock, AlertTriangle } from "lucide-react";

export default function Dashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const router = useRouter();
	const { data: emailStats } = useQuery(
		orpc.emails.getEmailStats.queryOptions({ timeRange: "all" })
	);

	return (
		<div className="space-y-8">
			<div>
				<h2 className="text-2xl font-bold mb-6">Email Campaign Overview</h2>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<EmailStatsCard
						title="Total Emails"
						value={emailStats?.totalEmails || 0}
						icon={Mail}
						description="All campaigns"
					/>
					<EmailStatsCard
						title="Scheduled"
						value={emailStats?.scheduled || 0}
						icon={Clock}
						description="Pending delivery"
					/>
					<EmailStatsCard
						title="Sent"
						value={emailStats?.sent || 0}
						icon={Send}
						description="Successfully delivered"
					/>
					<EmailStatsCard
						title="Delivery Rate"
						value={`${emailStats?.deliveryRate || 0}%`}
						icon={CheckCircle2}
						description={`${emailStats?.delivered || 0} of ${emailStats?.totalRecipients || 0} delivered`}
					/>
					<EmailStatsCard
						title="Open Rate"
						value={`${emailStats?.openRate || 0}%`}
						icon={Eye}
						description={`${emailStats?.opened || 0} recipients opened`}
					/>
					<EmailStatsCard
						title="Bounce Rate"
						value={`${emailStats?.bounceRate || 0}%`}
						icon={AlertTriangle}
						description={`${emailStats?.bounced || 0} bounced`}
					/>
				</div>
				<div className="mt-6">
					<Button onClick={() => router.push("/emails")}>
						View All Emails
					</Button>
				</div>
			</div>
		</div>
	);
}
