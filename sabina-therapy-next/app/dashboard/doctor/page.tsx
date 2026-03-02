import { redirect } from "next/navigation";
import { DoctorDashboardClient } from "@/components/dashboard/doctor-dashboard-client";
import { getAuthSession } from "@/lib/auth";

export default async function DoctorDashboardPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  return <DoctorDashboardClient />;
}
