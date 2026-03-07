"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScenarioCreateForm } from "@/components/vr/scenario-create-form";
import { apiFetch } from "@/lib/client-api";
import { toAmmanLabel } from "@/lib/time";

type Scenario = {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  slug: string;
  youtubeId: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    role: "ADMIN" | "DOCTOR" | "USER";
  };
  _count: {
    sessions: number;
  };
};

type Mode = "doctor" | "admin";

type VrScenariosManagerProps = {
  mode: Mode;
};

type Appointment = {
  id: string;
  status: "requested" | "confirmed" | "canceled" | "completed";
  sessionMode?: "zoom" | "vr";
  startAt: string;
  patientName: string;
};

function sessionLink(sessionId: string) {
  if (typeof window === "undefined") {
    return `/vr/session/${sessionId}`;
  }

  return `${window.location.origin}/vr/session/${sessionId}`;
}

export function VrScenariosManager({ mode }: VrScenariosManagerProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");

  const scenariosQuery = useQuery({
    queryKey: ["vr-scenarios", mode],
    queryFn: () => apiFetch<{ scenarios: Scenario[] }>("/api/vr/scenarios")
  });

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", "doctor", "vr-manager"],
    queryFn: () => apiFetch<{ appointments: Appointment[] }>("/api/appointments"),
    enabled: mode === "doctor"
  });

  const vrAppointments = useMemo(
    () =>
      (appointmentsQuery.data?.appointments ?? []).filter(
        (item) => item.status === "confirmed" && item.sessionMode === "vr"
      ),
    [appointmentsQuery.data?.appointments]
  );

  useEffect(() => {
    if (mode !== "doctor") return;
    if (selectedAppointmentId && !vrAppointments.some((item) => item.id === selectedAppointmentId)) {
      setSelectedAppointmentId("");
    }
  }, [mode, selectedAppointmentId, vrAppointments]);

  const createScenarioMutation = useMutation({
    mutationFn: (payload: {
      titleEn: string;
      titleAr: string;
      descriptionEn: string;
      descriptionAr: string;
      youtubeUrl: string;
    }) =>
      apiFetch<{ scenario: Scenario }>("/api/vr/scenarios", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      scenariosQuery.refetch();
      setStatusMessage("Scenario created.");
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    }
  });

  const createSessionMutation = useMutation({
    mutationFn: (payload: { scenarioId: string; appointmentId?: string }) =>
      apiFetch<{ session: { id: string } }>("/api/vr/sessions", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: (payload) => {
      const link = sessionLink(payload.session.id);
      void navigator.clipboard?.writeText(link);
      setLastSessionId(payload.session.id);
      const appointment = vrAppointments.find((item) => item.id === selectedAppointmentId);
      if (appointment) {
        setStatusMessage(`Session created for ${appointment.patientName}. Link copied: ${link}`);
      } else {
        setStatusMessage(`Session created. Link copied: ${link}`);
      }
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    }
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: (scenarioId: string) =>
      apiFetch<{ success: true }>(`/api/vr/scenarios/${scenarioId}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      scenariosQuery.refetch();
      setStatusMessage("Scenario deleted.");
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    }
  });

  const updateScenarioMutation = useMutation({
    mutationFn: (payload: {
      scenarioId: string;
      titleEn: string;
      titleAr: string;
      descriptionEn: string;
      descriptionAr: string;
      youtubeUrl: string;
    }) =>
      apiFetch<{ scenario: Scenario }>(`/api/vr/scenarios/${payload.scenarioId}`, {
        method: "PATCH",
        body: JSON.stringify({
          titleEn: payload.titleEn,
          titleAr: payload.titleAr,
          descriptionEn: payload.descriptionEn,
          descriptionAr: payload.descriptionAr,
          youtubeUrl: payload.youtubeUrl
        })
      }),
    onSuccess: () => {
      setEditingScenarioId(null);
      scenariosQuery.refetch();
      setStatusMessage("Scenario updated.");
    },
    onError: (error: Error) => {
      setStatusMessage(error.message);
    }
  });

  const scenarios = scenariosQuery.data?.scenarios ?? [];

  return (
    <div className="section-shell space-y-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "doctor" ? "Create VR Scenario" : "Create Scenario (Admin)"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScenarioCreateForm
            submitting={createScenarioMutation.isPending}
            onSubmit={(payload) => createScenarioMutation.mutateAsync(payload).then(() => undefined)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{mode === "doctor" ? "VR Scenarios" : "All VR Scenarios"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusMessage ? <p className="text-sm text-medical-700">{statusMessage}</p> : null}
          {mode === "doctor" ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
              <Label htmlFor="vr-appointment-select">Assign session to patient (optional)</Label>
              <select
                id="vr-appointment-select"
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                value={selectedAppointmentId}
                onChange={(event) => setSelectedAppointmentId(event.target.value)}
              >
                <option value="">Create generic session (manual link sharing)</option>
                {vrAppointments.map((appointment) => (
                  <option key={appointment.id} value={appointment.id}>
                    {appointment.patientName} - {toAmmanLabel(new Date(appointment.startAt))}
                  </option>
                ))}
              </select>
              {appointmentsQuery.isLoading ? (
                <p className="mt-2 text-xs text-slate-500">Loading confirmed VR appointments...</p>
              ) : null}
              {!appointmentsQuery.isLoading && vrAppointments.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  No confirmed VR appointments yet. You can still create a generic session link.
                </p>
              ) : null}
            </div>
          ) : null}
          {mode === "doctor" && lastSessionId ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
              <p>
                Session link: <code>/vr/session/{lastSessionId}</code>
              </p>
              <p className="mt-1">
                Doctor control panel: <code>/doctor/vr/session/{lastSessionId}</code>
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => void navigator.clipboard?.writeText(sessionLink(lastSessionId))}
              >
                Copy session link
              </Button>
            </div>
          ) : null}

          {scenarios.map((scenario) => (
            <div key={scenario.id} className="rounded-lg border border-slate-200 p-4">
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">{scenario.titleEn}</p>
                <p className="text-sm text-slate-600">{scenario.titleAr}</p>
                <p className="text-xs text-slate-500">
                  slug: {scenario.slug} | youtubeId: {scenario.youtubeId} | sessions: {scenario._count.sessions}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {mode === "doctor" ? (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        createSessionMutation.mutate({
                          scenarioId: scenario.id,
                          appointmentId: selectedAppointmentId || undefined
                        })
                      }
                      disabled={createSessionMutation.isPending}
                    >
                      {selectedAppointmentId ? "Start Session for Patient" : "Start Session"}
                    </Button>
                  </>
                ) : null}

                {mode === "admin" ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditingScenarioId(scenario.id)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => deleteScenarioMutation.mutate(scenario.id)}
                    >
                      Delete
                    </Button>
                  </>
                ) : null}
              </div>

              {mode === "admin" && editingScenarioId === scenario.id ? (
                <EditScenarioForm
                  scenario={scenario}
                  loading={updateScenarioMutation.isPending}
                  onCancel={() => setEditingScenarioId(null)}
                  onSubmit={(payload) =>
                    updateScenarioMutation
                      .mutateAsync({ scenarioId: scenario.id, ...payload })
                      .then(() => undefined)
                  }
                />
              ) : null}
            </div>
          ))}

          {!scenarios.length && !scenariosQuery.isLoading ? (
            <p className="text-sm text-slate-500">No scenarios yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

type EditScenarioFormProps = {
  scenario: Scenario;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (payload: {
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    youtubeUrl: string;
  }) => Promise<void>;
};

function EditScenarioForm({ scenario, loading, onCancel, onSubmit }: EditScenarioFormProps) {
  const [titleEn, setTitleEn] = useState(scenario.titleEn);
  const [titleAr, setTitleAr] = useState(scenario.titleAr);
  const [descriptionEn, setDescriptionEn] = useState(scenario.descriptionEn);
  const [descriptionAr, setDescriptionAr] = useState(scenario.descriptionAr);
  const [youtubeUrl, setYoutubeUrl] = useState(`https://www.youtube.com/watch?v=${scenario.youtubeId}`);

  return (
    <form
      className="mt-4 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit({ titleEn, titleAr, descriptionEn, descriptionAr, youtubeUrl });
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Title EN</Label>
          <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Title AR</Label>
          <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} required />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Description EN</Label>
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="space-y-1">
          <Label>Description AR</Label>
          <textarea
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>YouTube URL</Label>
        <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} required />
      </div>

      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
