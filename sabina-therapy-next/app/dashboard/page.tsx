import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

export default async function DashboardRouterPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (session.user.role === "DOCTOR") {
    redirect("/dashboard/doctor");
  }

  redirect("/dashboard/user");
}
