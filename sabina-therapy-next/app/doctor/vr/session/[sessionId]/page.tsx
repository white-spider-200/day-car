import { redirect } from "next/navigation";
import { DoctorVrSessionClient } from "@/components/vr/doctor-vr-session-client";
import { getAuthSession } from "@/lib/auth";

export default async function DoctorVrSessionPage({ params }: { params: { sessionId: string } }) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  return <DoctorVrSessionClient sessionId={params.sessionId} />;
}
