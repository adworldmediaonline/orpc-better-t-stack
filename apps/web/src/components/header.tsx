"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { Mail, Zap, Home, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
	const pathname = usePathname();

	const links = [
		{ to: "/", label: "Home", icon: Home },
		{ to: "/dashboard", label: "Dashboard", icon: BarChart3 },
		{ to: "/emails", label: "Emails", icon: Mail },
	] as const;

	const isActive = (path: string) => {
		if (path === "/" && pathname === "/") return true;
		if (path !== "/" && pathname.startsWith(path)) return true;
		return false;
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
			<div className="container mx-auto max-w-7xl px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
						<div className="p-2 rounded-lg bg-primary/10">
							<Zap className="h-6 w-6 text-primary" />
						</div>
						<span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
							SendLater
						</span>
					</Link>

					{/* Navigation */}
					<nav className="hidden md:flex items-center gap-1">
						{links.map(({ to, label, icon: Icon }) => (
							<Link
								key={to}
								href={to}
								className={cn(
									"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 focus-ring",
									isActive(to)
										? "bg-primary/10 text-primary"
										: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
								)}
							>
								<Icon className="h-4 w-4" />
								{label}
							</Link>
						))}
					</nav>

					{/* Right side */}
					<div className="flex items-center gap-3">
						<ModeToggle />
						<UserMenu />
					</div>
				</div>
			</div>
		</header>
	);
}
