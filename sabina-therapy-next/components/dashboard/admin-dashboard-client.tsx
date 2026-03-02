"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/client-api";
import { toAmmanLabel } from "@/lib/time";

type DoctorsResponse = {
  doctors: Array<{
    id: string;
    specialty: string;
    location: string;
    isApproved: boolean;
    user: {
      name: string;
      email: string;
    };
    verification: {
      licenseNumber: string;
    } | null;
  }>;
};

type UsersResponse = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
};

type AppointmentsResponse = {
  appointments: Array<{
    id: string;
    status: string;
    startAt: string;
    doctorName: string;
    patientName: string;
  }>;
};

export function AdminDashboardClient() {
  const [message, setMessage] = useState<string | null>(null);

  const doctorsQuery = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: () => apiFetch<DoctorsResponse>("/api/admin/doctors")
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch<UsersResponse>("/api/admin/users")
  });

  const appointmentsQuery = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: () => apiFetch<AppointmentsResponse>("/api/appointments")
  });

  const approvalMutation = useMutation({
    mutationFn: (payload: { doctorId: string; approved: boolean }) =>
      apiFetch<{ doctor: { id: string; isApproved: boolean } }>(
        `/api/admin/doctors/${payload.doctorId}/approval`,
        {
          method: "PATCH",
          body: JSON.stringify({ approved: payload.approved })
        }
      ),
    onSuccess: () => {
      setMessage("Doctor approval updated.");
      doctorsQuery.refetch();
    },
    onError: (error: Error) => {
      setMessage(error.message);
    }
  });

  return (
    <div className="section-shell py-10 space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Doctor Review Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {doctorsQuery.data?.doctors.map((doctor) => (
            <div key={doctor.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <p className="font-medium">{doctor.user.name}</p>
              <p>{doctor.user.email}</p>
              <p>
                {doctor.specialty} | {doctor.location}
              </p>
              <p>License: {doctor.verification?.licenseNumber ?? "N/A"}</p>
              <p>Status: {doctor.isApproved ? "Approved" : "Pending / Denied"}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => approvalMutation.mutate({ doctorId: doctor.id, approved: true })}>
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => approvalMutation.mutate({ doctorId: doctor.id, approved: false })}
                >
                  Deny
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {usersQuery.data?.users.map((user) => (
            <div key={user.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <p className="font-medium">{user.name}</p>
              <p>{user.email}</p>
              <p>Role: {user.role}</p>
              <p>Created: {toAmmanLabel(new Date(user.createdAt))}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {appointmentsQuery.data?.appointments.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-200 p-3 text-sm">
              <p className="font-medium">
                {item.patientName} with {item.doctorName}
              </p>
              <p>{toAmmanLabel(new Date(item.startAt))}</p>
              <p className="capitalize">Status: {item.status}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
