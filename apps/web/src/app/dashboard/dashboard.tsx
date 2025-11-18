"use client";
import { Button } from "@/components/ui/button";

import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { orpc } from "@/utils/orpc";
import { EmailsContent } from "../emails/emails-content";
import {
	Zap,
	Plus,
	ArrowRight
} from "lucide-react";

export default function Dashboard({
	session,
}: {
	session: typeof authClient.$Infer.Session;
}) {
	const router = useRouter();


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

			{/* Emails Table */}
			<div>
				<div className="flex items-center justify-between mb-6">
					<div>
						<h2 className="text-2xl font-bold">Recent Emails</h2>
						<p className="text-muted-foreground">Manage your email campaigns</p>
					</div>
				</div>
				<EmailsContent />
			</div>


		</div>
	);
}
