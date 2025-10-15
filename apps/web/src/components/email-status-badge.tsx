"use client";

import { Badge } from "./ui/badge";
import {
	Clock,
	Send,
	CheckCircle2,
	XCircle,
	Ban,
	Loader2,
} from "lucide-react";

interface EmailStatusBadgeProps {
	status: "SCHEDULED" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";
}

export function EmailStatusBadge({ status }: EmailStatusBadgeProps) {
	const config = {
		SCHEDULED: {
			label: "Scheduled",
			icon: Clock,
			className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
		},
		SENDING: {
			label: "Sending",
			icon: Loader2,
			className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
		},
		SENT: {
			label: "Sent",
			icon: CheckCircle2,
			className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
		},
		FAILED: {
			label: "Failed",
			icon: XCircle,
			className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
		},
		CANCELLED: {
			label: "Cancelled",
			icon: Ban,
			className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
		},
	};

	const { label, icon: Icon, className } = config[status];

	return (
		<Badge variant="outline" className={`gap-1 ${className}`}>
			<Icon className={`h-3 w-3 ${status === "SENDING" ? "animate-spin" : ""}`} />
			{label}
		</Badge>
	);
}

