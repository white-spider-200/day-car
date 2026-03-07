"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/client-api";
import { VR_REALTIME_ENABLED } from "@/lib/vr-realtime";

type SessionResponse = {
  session: {
    id: string;
    status: "WAITING" | "LIVE" | "ENDED";
    scenario: {
      titleEn: string;
      youtubeId: string;
    };
    patient: {
      name: string;
      email: string;
    } | null;
  };
};

export function DoctorVrSessionClient({ sessionId }: { sessionId: string }) {
  const sessionQuery = useQuery({
    queryKey: ["doctor-vr-session", sessionId],
    queryFn: () => apiFetch<SessionResponse>(`/api/vr/sessions/${sessionId}`)
  });

  const endSessionMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ session: { status: "ENDED" } }>(`/api/vr/sessions/${sessionId}/control`, {
        method: "POST",
        body: JSON.stringify({ type: "END_SESSION" })
      }),
    onSuccess: () => {
      sessionQuery.refetch();
    }
  });

  const session = sessionQuery.data?.session;

  return (
    <div className="section-shell py-10">
      <Card>
        <CardHeader>
          <CardTitle>Doctor VR Session Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {session ? (
            <>
              <p className="text-sm text-slate-700">Session: {session.id}</p>
              <p className="text-sm text-slate-700">Scenario: {session.scenario.titleEn}</p>
              <p className="text-sm text-slate-700">Patient: {session.patient?.name ?? "Waiting"}</p>
              <p className="text-sm text-slate-700">Status: {session.status}</p>
              <Button onClick={() => endSessionMutation.mutate()} disabled={session.status === "ENDED"}>
                End Session
              </Button>
            </>
          ) : null}

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Realtime controls (Play/Pause/Seek/Change Scenario) are scaffolded for Phase 2.
            {VR_REALTIME_ENABLED ? " Realtime is enabled." : " Realtime is currently disabled."}
          </div>

          {sessionQuery.isLoading ? <p className="text-sm text-slate-500">Loading session...</p> : null}
          {sessionQuery.error instanceof Error ? (
            <p className="text-sm text-red-600">{sessionQuery.error.message}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
