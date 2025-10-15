import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, LogOut, Mail } from "lucide-react";

export default function UserMenu() {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Skeleton className="h-10 w-10 rounded-full" />;
	}

	if (!session) {
		return (
			<Button variant="outline" asChild className="focus-ring">
				<Link href="/login">Sign In</Link>
			</Button>
		);
	}

	const userInitials = session.user.name
		?.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase() || "U";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="relative h-10 w-10 rounded-full focus-ring hover:bg-muted/50"
				>
					<Avatar className="h-9 w-9">
						<AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
						<AvatarFallback className="bg-primary/10 text-primary font-semibold">
							{userInitials}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-64 bg-card/95 backdrop-blur-md border-border/50" align="end">
				<div className="flex items-center gap-3 p-3">
					<Avatar className="h-10 w-10">
						<AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
						<AvatarFallback className="bg-primary/10 text-primary font-semibold">
							{userInitials}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<p className="text-sm font-medium">{session.user.name}</p>
						<p className="text-xs text-muted-foreground">{session.user.email}</p>
					</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link href="/dashboard" className="flex items-center gap-2 w-full">
						<User className="h-4 w-4" />
						Dashboard
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/emails" className="flex items-center gap-2 w-full">
						<Mail className="h-4 w-4" />
						Emails
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:text-destructive cursor-pointer"
					onClick={() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => {
									router.push("/");
								},
							},
						});
					}}
				>
					<LogOut className="mr-2 h-4 w-4" />
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
