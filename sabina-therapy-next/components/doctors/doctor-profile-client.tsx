"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/client-api";
import { locationLabel, specialtyLabel } from "@/lib/i18n";
import { toAmmanLabel } from "@/lib/time";

type DoctorProfileResponse = {
  doctor: {
    id: string;
    slug: string;
    specialty: string;
    bio: string;
    languages: string[];
    location: string;
    fees: number;
    photoUrl: string;
    user: { name: string };
    verification: { verificationBadge: boolean; licenseNumber: string } | null;
    scheduleSlots: { id: string; startAt: string; endAt: string }[];
    reviews: { id: string; rating: number; comment?: string | null; user: { name: string } }[];
  };
};

export function DoctorProfileClient({ id }: { id: string }) {
  const { data: session } = useSession();
  const [selectedSlot, setSelectedSlot] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const doctorQuery = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => apiFetch<DoctorProfileResponse>(`/api/doctors/${id}`)
  });

  const createAppointment = useMutation({
    mutationFn: async () => {
      if (!doctorQuery.data?.doctor || !selectedSlot) {
        throw new Error("Please select a slot");
      }

      return apiFetch<{ appointment: { id: string; status: string } }>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: doctorQuery.data.doctor.id,
          slotId: selectedSlot,
          contactEmail,
          notes
        })
      });
    },
    onSuccess: (data) => {
      setMessage(`Appointment created (${data.appointment.status}).`);
      setSelectedSlot("");
      doctorQuery.refetch();
    },
    onError: (error: Error) => {
      setMessage(error.message);
    }
  });

  const canBook = useMemo(() => session?.user?.role === "USER", [session?.user?.role]);

  if (doctorQuery.isLoading) {
    return <div className="section-shell py-10">Loading doctor profile...</div>;
  }

  if (doctorQuery.error || !doctorQuery.data?.doctor) {
    return <div className="section-shell py-10 text-red-600">Doctor profile not found.</div>;
  }

  const { doctor } = doctorQuery.data;

  return (
    <div className="section-shell py-10">
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{doctor.user.name}</CardTitle>
                <p className="text-sm text-slate-600">{specialtyLabel(doctor.specialty)}</p>
              </div>
              {doctor.verification?.verificationBadge ? <Badge>License Verified</Badge> : null}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">{doctor.bio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{locationLabel(doctor.location)}</Badge>
              {doctor.languages.map((language) => (
                <Badge key={language}>{language}</Badge>
              ))}
              <Badge>{doctor.fees} JOD / session</Badge>
            </div>

            <div className="mt-6">
              <h3 className="mb-3 font-semibold text-slate-900">Available Slots</h3>
              <div className="grid gap-2 md:grid-cols-2">
                {doctor.scheduleSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`rounded-md border p-3 text-left text-sm transition ${
                      selectedSlot === slot.id
                        ? "border-medical-600 bg-medical-50 text-medical-700"
                        : "border-slate-200 hover:border-medical-300"
                    }`}
                  >
                    {toAmmanLabel(new Date(slot.startAt))}
                  </button>
                ))}
              </div>
              {doctor.scheduleSlots.length === 0 ? <p className="text-sm text-slate-500">No open slots.</p> : null}
            </div>

            <div className="mt-6">
              <h3 className="mb-3 font-semibold text-slate-900">Recent Reviews</h3>
              <div className="space-y-2">
                {doctor.reviews.map((review) => (
                  <div key={review.id} className="rounded-md border border-slate-200 p-3 text-sm">
                    <div className="font-medium">{review.user.name}</div>
                    <div className="text-amber-600">{"★".repeat(review.rating)}</div>
                    {review.comment ? <p className="text-slate-600">{review.comment}</p> : null}
                  </div>
                ))}
                {doctor.reviews.length === 0 ? <p className="text-sm text-slate-500">No reviews yet.</p> : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Book Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            {!session?.user ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Login as a user to book this doctor.</p>
                <Link href="/login">
                  <Button className="w-full">Login</Button>
                </Link>
              </div>
            ) : !canBook ? (
              <p className="text-sm text-slate-600">Only patient accounts can book appointments.</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="contactEmail">Contact Email (optional)</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What would you like help with?"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!selectedSlot || createAppointment.isPending}
                  onClick={() => createAppointment.mutate()}
                >
                  {createAppointment.isPending ? "Booking..." : "Confirm Booking"}
                </Button>
                {message ? <p className="text-sm text-slate-600">{message}</p> : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
