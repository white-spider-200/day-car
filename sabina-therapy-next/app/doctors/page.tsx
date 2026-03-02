import { DoctorsPageClient } from "@/components/doctors/doctors-page-client";

export const dynamic = "force-dynamic";

export default function DoctorsPage({
  searchParams
}: {
  searchParams?: {
    q?: string;
    language?: string;
  };
}) {
  return <DoctorsPageClient initialQ={searchParams?.q} initialLanguage={searchParams?.language} />;
}
