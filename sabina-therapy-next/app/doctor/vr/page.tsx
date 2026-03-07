import { redirect } from "next/navigation";
import { VrScenariosManager } from "@/components/vr/vr-scenarios-manager";
import { getAuthSession } from "@/lib/auth";

export default async function DoctorVrPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  return <VrScenariosManager mode="doctor" />;
}
