"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number>;
          events?: {
            onReady?: () => void;
          };
        }
      ) => {
        playVideo: () => void;
        pauseVideo: () => void;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
        destroy: () => void;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Youtube360PlayerProps = {
  youtubeId: string;
  onReady?: (controls: Youtube360PlayerHandle) => void;
};

export type Youtube360PlayerHandle = {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
};

let isScriptLoading = false;

export function Youtube360Player({ youtubeId, onReady }: Youtube360PlayerProps) {
  const reactId = useId();
  const containerId = useMemo(
    () => `yt-player-${youtubeId}-${reactId.replace(/[:]/g, "")}`,
    [reactId, youtubeId]
  );
  const playerRef = useRef<{
    playVideo: () => void;
    pauseVideo: () => void;
    seekTo: (seconds: number, allowSeekAhead: boolean) => void;
    destroy: () => void;
  } | null>(null);

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function createPlayer() {
      if (!window.YT?.Player || cancelled) {
        return;
      }

      playerRef.current?.destroy();

      playerRef.current = new window.YT.Player(containerId, {
        videoId: youtubeId,
        playerVars: {
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            setReady(true);
            onReady?.({
              play: () => playerRef.current?.playVideo(),
              pause: () => playerRef.current?.pauseVideo(),
              seekTo: (seconds: number) => playerRef.current?.seekTo(seconds, true)
            });
          }
        }
      });
    }

    if (window.YT?.Player) {
      createPlayer();
    } else {
      const previousReadyCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReadyCallback?.();
        createPlayer();
      };

      if (!isScriptLoading) {
        isScriptLoading = true;
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [containerId, youtubeId, onReady]);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
        <div id={containerId} className="aspect-video w-full" />
      </div>
      {!ready ? <p className="text-xs text-slate-500">Loading YouTube player...</p> : null}
    </div>
  );
}
