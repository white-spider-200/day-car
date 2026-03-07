import { redirect } from "next/navigation";
import { PatientVrSessionClient } from "@/components/vr/patient-vr-session-client";
import { getAuthSession } from "@/lib/auth";

export default async function PatientVrSessionPage({ params }: { params: { sessionId: string } }) {
  const session = await getAuthSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <PatientVrSessionClient sessionId={params.sessionId} />;
}
