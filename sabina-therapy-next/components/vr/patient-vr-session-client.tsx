"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/providers/language-provider";
import { Youtube360Player } from "@/components/vr/youtube-360-player";
import { apiFetch } from "@/lib/client-api";

type SessionPayload = {
  session: {
    id: string;
    status: "WAITING" | "LIVE" | "ENDED";
    scenario: {
      id: string;
      titleEn: string;
      titleAr: string;
      descriptionEn: string;
      descriptionAr: string;
      youtubeId: string;
    };
    doctor: {
      user: {
        name: string;
      };
    };
  };
};

export function PatientVrSessionClient({ sessionId }: { sessionId: string }) {
  const { lang } = useLanguage();
  const [isOverwhelmed, setIsOverwhelmed] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerControls, setPlayerControls] = useState<{
    play: () => void;
    pause: () => void;
    seekTo: (seconds: number) => void;
  } | null>(null);

  const sessionQuery = useQuery({
    queryKey: ["vr-session", sessionId],
    queryFn: () => apiFetch<SessionPayload>(`/api/vr/sessions/${sessionId}`)
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ session: { id: string; status: "WAITING" | "LIVE" | "ENDED" } }>(
        `/api/vr/sessions/${sessionId}/join`,
        {
          method: "POST"
        }
      ),
    onSuccess: () => {
      sessionQuery.refetch();
    }
  });

  useEffect(() => {
    if (!sessionQuery.data || joinMutation.isPending || joinMutation.isSuccess) {
      return;
    }

    void joinMutation.mutateAsync();
  }, [joinMutation, sessionQuery.data]);

  const session = sessionQuery.data?.session;

  const title = useMemo(() => {
    if (!session) return "";
    return lang === "ar" ? session.scenario.titleAr : session.scenario.titleEn;
  }, [lang, session]);

  const description = useMemo(() => {
    if (!session) return "";
    return lang === "ar" ? session.scenario.descriptionAr : session.scenario.descriptionEn;
  }, [lang, session]);

  return (
    <div className="section-shell py-10">
      <Card>
        <CardHeader>
          <CardTitle>{title || "VR Session"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <>
              <p className="text-sm text-slate-700">{description}</p>
              <p className="text-xs text-slate-500">Doctor: {session.doctor.user.name}</p>
              <p className="text-xs text-slate-500">Status: {session.status}</p>

              <Youtube360Player
                youtubeId={session.scenario.youtubeId}
                onReady={(controls) => {
                  setPlayerControls(controls);
                  setPlayerReady(true);
                }}
              />

              <Button
                type="button"
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={!playerReady}
                onClick={() => {
                  playerControls?.pause();
                  setIsOverwhelmed(true);
                }}
              >
                I feel overwhelmed
              </Button>

              {isOverwhelmed ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Please take a break.
                </p>
              ) : null}
            </>
          ) : null}

          {sessionQuery.isLoading ? <p className="text-sm text-slate-500">Loading session...</p> : null}
          {sessionQuery.error instanceof Error ? (
            <p className="text-sm text-red-600">{sessionQuery.error.message}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
