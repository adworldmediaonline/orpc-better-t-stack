"use client";

import { Badge } from "./ui/badge";
import {
	Clock,
	CheckCircle2,
	Eye,
	MousePointerClick,
	AlertTriangle,
	Ban,
} from "lucide-react";

interface RecipientStatusBadgeProps {
	status: "PENDING" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "COMPLAINED";
}

export function RecipientStatusBadge({ status }: RecipientStatusBadgeProps) {
	const config = {
		PENDING: {
			label: "Pending",
			icon: Clock,
			className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
		},
		DELIVERED: {
			label: "Delivered",
			icon: CheckCircle2,
			className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
		},
		OPENED: {
			label: "Opened",
			icon: Eye,
			className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
		},
		CLICKED: {
			label: "Clicked",
			icon: MousePointerClick,
			className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
		},
		BOUNCED: {
			label: "Bounced",
			icon: AlertTriangle,
			className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
		},
		COMPLAINED: {
			label: "Spam",
			icon: Ban,
			className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
		},
	};

	const { label, icon: Icon, className } = config[status];

	return (
		<Badge variant="outline" className={`gap-1 ${className}`}>
			<Icon className="h-3 w-3" />
			{label}
		</Badge>
	);
}

