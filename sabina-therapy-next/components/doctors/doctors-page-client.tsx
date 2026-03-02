"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/client-api";
import { locationLabel, specialtyLabel } from "@/lib/i18n";
import { type DoctorDTO } from "@/lib/types";

type DoctorResponse = { doctors: DoctorDTO[] };

const locations = ["", "AMMAN", "IRBID", "ZARQA", "ONLINE"];
const specialties = ["", "THERAPY", "PSYCHIATRY", "COUNSELING", "CHILD_THERAPY", "FAMILY_THERAPY", "CBT"];

export function DoctorsPageClient({
  initialQ,
  initialLanguage
}: {
  initialQ?: string;
  initialLanguage?: string;
}) {
  const [q, setQ] = useState(initialQ ?? "");
  const [language, setLanguage] = useState(initialLanguage ?? "");
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (language) params.set("language", language);
    if (location) params.set("location", location);
    if (specialty) params.set("specialty", specialty);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    return params.toString();
  }, [q, language, location, specialty, minPrice, maxPrice]);

  const doctorsQuery = useQuery({
    queryKey: ["doctors", query],
    queryFn: () => apiFetch<DoctorResponse>(`/api/doctors?${query}`)
  });

  return (
    <div className="section-shell py-10">
      <div className="rounded-2xl border border-medical-100 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Find Your Doctor</h1>
        <p className="mt-1 text-sm text-slate-600">Filter by language, location, specialty, and fee.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
          <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="">Language</option>
            <option value="Arabic">Arabic</option>
            <option value="English">English</option>
          </Select>
          <Select value={location} onChange={(e) => setLocation(e.target.value)}>
            {locations.map((value) => (
              <option key={value} value={value}>
                {value ? locationLabel(value) : "Location"}
              </option>
            ))}
          </Select>
          <Select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            {specialties.map((value) => (
              <option key={value} value={value}>
                {value ? specialtyLabel(value) : "Specialty"}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min JOD"
          />
          <Input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max JOD"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctorsQuery.isLoading ? <p>Loading doctors...</p> : null}
        {doctorsQuery.error ? <p className="text-red-600">{doctorsQuery.error.message}</p> : null}

        {doctorsQuery.data?.doctors.map((doctor) => (
          <Card key={doctor.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{doctor.user.name}</CardTitle>
                {doctor.isTopDoctor ? <Badge>Top Doctor</Badge> : null}
              </div>
              <p className="text-sm text-slate-500">{specialtyLabel(doctor.specialty)}</p>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm text-slate-600">{doctor.bio}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <Badge>{locationLabel(doctor.location)}</Badge>
                {doctor.languages.map((lang) => (
                  <Badge key={lang}>{lang}</Badge>
                ))}
              </div>
              <p className="mt-3 text-sm font-medium text-medical-700">{doctor.fees} JOD / session</p>
              <Link href={`/doctors/${doctor.slug}`} className="mt-4 block">
                <Button className="w-full">View Profile</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {!doctorsQuery.isLoading && doctorsQuery.data?.doctors.length === 0 ? (
        <p className="mt-8 text-center text-slate-500">No doctors found for selected filters.</p>
      ) : null}
    </div>
  );
}
