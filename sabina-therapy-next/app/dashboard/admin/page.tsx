import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/dashboard/admin-dashboard-client";
import { getAuthSession } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <AdminDashboardClient />;
}
