"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/client-api";
import { toAmmanLabel } from "@/lib/time";

type AppointmentResponse = {
  appointments: Array<{
    id: string;
    status: "requested" | "confirmed" | "canceled" | "completed";
    startAt: string;
    endAt: string;
    doctorName: string;
  }>;
};

export function UserDashboardClient({
  user
}: {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}) {
  const [message, setMessage] = useState<string | null>(null);

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "user"],
    queryFn: () => apiFetch<AppointmentResponse>("/api/appointments")
  });

  const joinMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      apiFetch<{ url: string }>("/api/zoom/join-info", {
        method: "POST",
        body: JSON.stringify({ appointmentId })
      }),
    onSuccess: (payload) => {
      window.open(payload.url, "_blank", "noopener,noreferrer");
    },
    onError: (error: Error) => {
      setMessage(error.message);
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      apiFetch<{ appointment: { id: string } }>(`/api/appointments/${appointmentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "canceled" })
      }),
    onSuccess: () => {
      appointmentsQuery.refetch();
      setMessage("Appointment canceled.");
    },
    onError: (error: Error) => {
      setMessage(error.message);
    }
  });

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const all = appointmentsQuery.data?.appointments ?? [];
    return {
      upcoming: all.filter((item) => new Date(item.endAt) >= now),
      past: all.filter((item) => new Date(item.endAt) < now)
    };
  }, [appointmentsQuery.data?.appointments]);

  return (
    <div className="section-shell py-10 space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700">
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          <p>Role: USER</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.map((appointment) => (
            <div key={appointment.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <p className="font-medium">{appointment.doctorName}</p>
              <p>{toAmmanLabel(new Date(appointment.startAt))} (Asia/Amman)</p>
              <p className="capitalize">Status: {appointment.status}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {appointment.status === "confirmed" ? (
                  <Button size="sm" onClick={() => joinMutation.mutate(appointment.id)}>
                    Join Call
                  </Button>
                ) : null}
                {appointment.status === "requested" || appointment.status === "confirmed" ? (
                  <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(appointment.id)}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          {upcoming.length === 0 ? <p className="text-sm text-slate-500">No upcoming appointments.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {past.map((appointment) => (
            <div key={appointment.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <p className="font-medium">{appointment.doctorName}</p>
              <p>{toAmmanLabel(new Date(appointment.startAt))}</p>
              <p className="capitalize">Status: {appointment.status}</p>
            </div>
          ))}
          {past.length === 0 ? <p className="text-sm text-slate-500">No past appointments.</p> : null}
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
