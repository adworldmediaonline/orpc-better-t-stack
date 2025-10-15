"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface EmailStatsCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	description?: string;
	trend?: {
		value: number;
		isPositive: boolean;
	};
	className?: string;
	delay?: number;
}

export function EmailStatsCard({
	title,
	value,
	icon: Icon,
	description,
	trend,
	className = "",
	delay = 0,
}: EmailStatsCardProps) {
	const getTrendIcon = () => {
		if (!trend) return <Minus className="h-3 w-3" />;
		return trend.isPositive ? (
			<TrendingUp className="h-3 w-3" />
		) : (
			<TrendingDown className="h-3 w-3" />
		);
	};

	const getTrendColor = () => {
		if (!trend) return "text-muted-foreground";
		return trend.isPositive ? "text-success" : "text-destructive";
	};

	return (
		<Card
			className={`
				group relative overflow-hidden transition-all duration-300 hover-lift
				border-border/50 bg-card/80 backdrop-blur-sm
				hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5
				animate-fade-in-up
				${className}
			`}
			style={{ animationDelay: `${delay}ms` }}
		>
			{/* Subtle gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

			<CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
				<CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
					{title}
				</CardTitle>
				<div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
					<Icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
				</div>
			</CardHeader>

			<CardContent className="relative space-y-2">
				<div className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors">
					{value}
				</div>

				{description && (
					<p className="text-sm text-muted-foreground leading-relaxed">
						{description}
					</p>
				)}

				{trend && (
					<div className="flex items-center gap-1">
						<Badge
							variant={trend.isPositive ? "default" : "destructive"}
							className={`
								text-xs px-2 py-1 h-auto
								${trend.isPositive
									? "bg-success/10 text-success hover:bg-success/20 border-success/20"
									: "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
								}
							`}
						>
							{getTrendIcon()}
							<span className="ml-1 font-medium">
								{Math.abs(trend.value)}%
							</span>
						</Badge>
						<span className="text-xs text-muted-foreground">
							{trend.isPositive ? "vs last period" : "vs last period"}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

