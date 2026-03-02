import { DoctorProfileClient } from "@/components/doctors/doctor-profile-client";

export const dynamic = "force-dynamic";

export default function DoctorProfilePage({ params }: { params: { id: string } }) {
  return <DoctorProfileClient id={params.id} />;
}
