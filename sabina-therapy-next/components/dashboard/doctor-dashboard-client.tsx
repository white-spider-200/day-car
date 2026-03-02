"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/client-api";
import { toAmmanLabel } from "@/lib/time";

type AppointmentResponse = {
  appointments: Array<{
    id: string;
    status: "requested" | "confirmed" | "canceled" | "completed";
    startAt: string;
    patientName: string;
  }>;
};

type DoctorProfileResponse = {
  doctor: {
    id: string;
    bio: string;
    fees: number;
    location: string;
    languages: string[];
    user: {
      name: string;
      email: string;
    };
  };
};

type SlotsResponse = {
  slots: Array<{
    id: string;
    startAt: string;
    endAt: string;
    isBooked: boolean;
  }>;
};

export function DoctorDashboardClient() {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [newSlotDateTime, setNewSlotDateTime] = useState("");

  const profileQuery = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: () => apiFetch<DoctorProfileResponse>("/api/doctor/profile")
  });

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "doctor"],
    queryFn: () => apiFetch<AppointmentResponse>("/api/appointments")
  });

  const slotsQuery = useQuery({
    queryKey: ["doctor-slots"],
    queryFn: () => apiFetch<SlotsResponse>("/api/doctor/slots")
  });

  const profileMutation = useMutation({
    mutationFn: (payload: { bio: string; fees: number }) =>
      apiFetch<{ doctor: { id: string } }>("/api/doctor/profile", {
        method: "PATCH",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      setStatusMessage("Profile updated.");
      profileQuery.refetch();
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    }
  });

  const appointmentStatusMutation = useMutation({
    mutationFn: (payload: { appointmentId: string; status: string }) =>
      apiFetch<{ appointment: { id: string } }>(`/api/appointments/${payload.appointmentId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: payload.status })
      }),
    onSuccess: () => {
      appointmentsQuery.refetch();
      setStatusMessage("Appointment updated.");
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    }
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
      setStatusMessage(error.message);
    }
  });

  const slotMutation = useMutation({
    mutationFn: () => {
      const startAt = new Date(newSlotDateTime);
      if (Number.isNaN(startAt.getTime())) {
        throw new Error("Enter valid date/time");
      }
      const endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + 50);

      return apiFetch<{ slot: { id: string } }>("/api/doctor/slots", {
        method: "POST",
        body: JSON.stringify({
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString()
        })
      });
    },
    onSuccess: () => {
      setStatusMessage("Slot added.");
      setNewSlotDateTime("");
      slotsQuery.refetch();
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    }
  });

  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) =>
      apiFetch<{ success: true }>(`/api/doctor/slots?slotId=${slotId}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      slotsQuery.refetch();
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    }
  });

  const requested = useMemo(
    () => (appointmentsQuery.data?.appointments ?? []).filter((a) => a.status === "requested"),
    [appointmentsQuery.data?.appointments]
  );

  const confirmed = useMemo(
    () => (appointmentsQuery.data?.appointments ?? []).filter((a) => a.status === "confirmed"),
    [appointmentsQuery.data?.appointments]
  );

  const doctor = profileQuery.data?.doctor;

  return (
    <div className="section-shell py-10 space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Profile Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">Update your bio and consultation fee.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label htmlFor="doctor-bio">Bio</Label>
              <Input
                id="doctor-bio"
                defaultValue={doctor?.bio}
                onBlur={(e) => {
                  if (!doctor) return;
                  profileMutation.mutate({ bio: e.target.value, fees: doctor.fees });
                }}
              />
            </div>
            <div>
              <Label htmlFor="doctor-fee">Fee (JOD)</Label>
              <Input
                id="doctor-fee"
                type="number"
                defaultValue={doctor?.fees}
                onBlur={(e) => {
                  if (!doctor) return;
                  profileMutation.mutate({ bio: doctor.bio, fees: Number(e.target.value) });
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {requested.map((appointment) => (
            <div key={appointment.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <p className="font-medium">{appointment.patientName}</p>
              <p>{toAmmanLabel(new Date(appointment.startAt))}</p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    appointmentStatusMutation.mutate({ appointmentId: appointment.id, status: "confirmed" })
                  }
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    appointmentStatusMutation.mutate({ appointmentId: appointment.id, status: "canceled" })
                  }
                >
                  Decline
                </Button>
              </div>
            </div>
          ))}
          {requested.length === 0 ? <p className="text-sm text-slate-500">No pending requests.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirmed Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {confirmed.map((appointment) => (
            <div key={appointment.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <p className="font-medium">{appointment.patientName}</p>
              <p>{toAmmanLabel(new Date(appointment.startAt))}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => joinMutation.mutate(appointment.id)}>
                  Start Call
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    appointmentStatusMutation.mutate({ appointmentId: appointment.id, status: "completed" })
                  }
                >
                  Mark Completed
                </Button>
              </div>
            </div>
          ))}
          {confirmed.length === 0 ? <p className="text-sm text-slate-500">No confirmed appointments.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Slots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="datetime-local"
              value={newSlotDateTime}
              onChange={(e) => setNewSlotDateTime(e.target.value)}
            />
            <Button onClick={() => slotMutation.mutate()}>Add Slot</Button>
          </div>
          <div className="space-y-2">
            {slotsQuery.data?.slots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span>{toAmmanLabel(new Date(slot.startAt))}</span>
                {!slot.isBooked ? (
                  <Button size="sm" variant="outline" onClick={() => deleteSlotMutation.mutate(slot.id)}>
                    Delete
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">Booked</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {statusMessage ? <p className="text-sm text-slate-600">{statusMessage}</p> : null}
    </div>
  );
}
