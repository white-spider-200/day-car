import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { locationLabel, specialtyLabel } from "@/lib/i18n";
import { type DoctorDTO } from "@/lib/types";

export function TopDoctors({ doctors }: { doctors: DoctorDTO[] }) {
  return (
    <section className="section-shell pb-12 sm:pb-16">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Top Doctors</h2>
        <Link href="/doctors" className="text-sm font-medium text-medical-700">
          Browse all doctors
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{doctor.user.name}</CardTitle>
                {doctor.verification?.verificationBadge ? <Badge>Verified</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">{specialtyLabel(doctor.specialty)}</p>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm text-slate-600">{doctor.bio}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">{locationLabel(doctor.location)}</span>
                <span className="font-semibold text-medical-700">{doctor.fees} JOD</span>
              </div>
              <Link href={`/doctors/${doctor.slug}`} className="mt-4 block">
                <Button className="w-full">View Profile</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
