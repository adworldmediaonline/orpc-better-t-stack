
import AuthForm from "@/components/auth-form";
import { auth } from "@orpc-better-t-stack/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (session) {
		redirect("/dashboard");
	}

	return <AuthForm />;

}
