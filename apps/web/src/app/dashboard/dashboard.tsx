"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orpc } from "@/utils/orpc";
import { EmailStatsCard } from "@/components/email-stats-card";
import {
	Mail,
	Send,
	CheckCircle2,
	Eye,
	Clock,
	AlertTriangle,
	Plus,
	ArrowRight,
	Zap,
	TrendingUp,
	Users
} from "lucide-react";

export default function Dashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const router = useRouter();
	const { data: emailStats } = useQuery(
		orpc.emails.getEmailStats.queryOptions({ timeRange: "all" })
	);

	// Mock trend data - in real app, this would come from API
	const mockTrends = {
		totalEmails: { value: 12, isPositive: true },
		scheduled: { value: 8, isPositive: true },
		sent: { value: 15, isPositive: true },
		deliveryRate: { value: 5, isPositive: true },
		openRate: { value: 23, isPositive: true },
		bounceRate: { value: 2, isPositive: false },
	};

	return (
		<div className="space-y-8 animate-fade-in-up">
			{/* Hero Section */}
			<div className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-white">
				<div className="relative z-10">
					<div className="flex items-center gap-3 mb-4">
						<div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
							<Zap className="h-8 w-8" />
						</div>
						<div>
							<h1 className="text-3xl font-bold">Welcome back, {session.user.name}!</h1>
							<p className="text-white/80 text-lg">Here's your email campaign overview</p>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-4 mt-6">
						<Button
							onClick={() => router.push("/emails/new")}
							variant="secondary"
							size="lg"
							className="bg-white text-primary hover:bg-white/90 focus-ring"
						>
							<Plus className="mr-2 h-5 w-5" />
							Create Email Campaign
						</Button>
						<Button
							onClick={() => router.push("/emails")}
							variant="outline"
							size="lg"
							className="bg-white/10 border-white/20 text-white hover:bg-white/20 focus-ring"
						>
							View All Emails
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Background decoration */}
				<div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
				<div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
			</div>

			{/* Stats Grid */}
			<div>
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-bold">Campaign Performance</h2>
						<p className="text-muted-foreground">Monitor your email marketing metrics</p>
					</div>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<TrendingUp className="h-4 w-4" />
						<span>All time</span>
					</div>
				</div>

				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					<EmailStatsCard
						title="Total Emails"
						value={emailStats?.totalEmails || 0}
						icon={Mail}
						description="All campaigns created"
						trend={mockTrends.totalEmails}
						delay={100}
					/>
					<EmailStatsCard
						title="Scheduled"
						value={emailStats?.scheduled || 0}
						icon={Clock}
						description="Pending delivery"
						trend={mockTrends.scheduled}
						delay={200}
					/>
					<EmailStatsCard
						title="Sent"
						value={emailStats?.sent || 0}
						icon={Send}
						description="Successfully delivered"
						trend={mockTrends.sent}
						delay={300}
					/>
					<EmailStatsCard
						title="Delivery Rate"
						value={`${emailStats?.deliveryRate || 0}%`}
						icon={CheckCircle2}
						description={`${emailStats?.delivered || 0} of ${emailStats?.totalRecipients || 0} delivered`}
						trend={mockTrends.deliveryRate}
						delay={400}
					/>
					<EmailStatsCard
						title="Open Rate"
						value={`${emailStats?.openRate || 0}%`}
						icon={Eye}
						description={`${emailStats?.opened || 0} recipients opened`}
						trend={mockTrends.openRate}
						delay={500}
					/>
					<EmailStatsCard
						title="Bounce Rate"
						value={`${emailStats?.bounceRate || 0}%`}
						icon={AlertTriangle}
						description={`${emailStats?.bounced || 0} bounced`}
						trend={mockTrends.bounceRate}
						delay={600}
					/>
				</div>
			</div>

			{/* Quick Actions */}
			<div>
				<h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card className="group cursor-pointer hover-lift" onClick={() => router.push("/emails/new")}>
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
									<Plus className="h-6 w-6 text-primary" />
								</div>
								<div>
									<h4 className="font-semibold">Create Campaign</h4>
									<p className="text-sm text-muted-foreground">Start a new email campaign</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="group cursor-pointer hover-lift" onClick={() => router.push("/emails")}>
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
									<Mail className="h-6 w-6 text-accent" />
								</div>
								<div>
									<h4 className="font-semibold">View Campaigns</h4>
									<p className="text-sm text-muted-foreground">Manage existing campaigns</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="group cursor-pointer hover-lift" onClick={() => router.push("/emails/new")}>
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
									<Users className="h-6 w-6 text-success" />
								</div>
								<div>
									<h4 className="font-semibold">Bulk Upload</h4>
									<p className="text-sm text-muted-foreground">Upload CSV recipients</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="group cursor-pointer hover-lift" onClick={() => router.push("/emails")}>
						<CardContent className="p-6">
							<div className="flex items-center gap-4">
								<div className="p-3 rounded-lg bg-info/10 group-hover:bg-info/20 transition-colors">
									<Zap className="h-6 w-6 text-info" />
								</div>
								<div>
									<h4 className="font-semibold">Analytics</h4>
									<p className="text-sm text-muted-foreground">View detailed reports</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
