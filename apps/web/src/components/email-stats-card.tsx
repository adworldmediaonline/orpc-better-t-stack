"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { LucideIcon } from "lucide-react";

interface EmailStatsCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	description?: string;
	trend?: {
		value: number;
		isPositive: boolean;
	};
}

export function EmailStatsCard({
	title,
	value,
	icon: Icon,
	description,
	trend,
}: EmailStatsCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{description && (
					<p className="text-xs text-muted-foreground mt-1">{description}</p>
				)}
				{trend && (
					<p
						className={`text-xs mt-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}
					>
						{trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
					</p>
				)}
			</CardContent>
		</Card>
	);
}

