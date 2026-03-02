import { redirect } from "next/navigation";
import { UserDashboardClient } from "@/components/dashboard/user-dashboard-client";
import { getAuthSession } from "@/lib/auth";

export default async function UserDashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "USER") {
    redirect("/dashboard");
  }

  return <UserDashboardClient user={session.user} />;
}
