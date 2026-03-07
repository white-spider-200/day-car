import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { VR360PlayerHandle } from '../components/VR360Player';
import { buildWebSocketUrls } from '../utils/api';
import { vrExamples } from '../data/vrExamples';

const VR360Player = lazy(() => import('../components/VR360Player'));

export default function PatientVRPage() {
  const sessionId = (() => {
    const parts = window.location.pathname.split('/');
    const index = parts.indexOf('vr-session');
    return index !== -1 ? parts[index + 1] : null;
  })();
  
  const playerRef = useRef<VR360PlayerHandle>(null);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [message, setMessage] = useState('Waiting for doctor to start session...');

  useEffect(() => {
    if (!sessionId) return;

    const wsCandidates = buildWebSocketUrls(`/vr-sessions/${sessionId}/patient`);
    let ws: WebSocket | null = null;
    let attemptIndex = 0;
    let activeIndex = 0;
    let hadSuccessfulConnection = false;
    let reconnectDelayMs = 800;
    let reconnectTimer: number | null = null;
    let stopped = false;

    const scheduleReconnect = () => {
      if (stopped) {
        return;
      }
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      reconnectTimer = window.setTimeout(() => {
        connect(activeIndex);
      }, reconnectDelayMs);
      reconnectDelayMs = Math.min(reconnectDelayMs * 2, 5000);
    };

    const connect = (index: number) => {
      if (stopped || wsCandidates.length === 0) {
        setStatus('disconnected');
        setMessage('Session disconnected.');
        return;
      }

      setStatus('connecting');
      const wsUrl = wsCandidates[index];
      attemptIndex = index + 1;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        activeIndex = index;
        hadSuccessfulConnection = true;
        reconnectDelayMs = 800;
        setStatus('connected');
        setMessage('Connected. Waiting for doctor to select a scenario.');
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        console.log('Patient received:', msg);

        if (msg.type === 'SYNC_STATE') {
            // Initial state
            if (msg.payload.video_id) {
               const example = vrExamples.find(e => e.id === msg.payload.video_id);
               if (example) {
                   setCurrentVideoSrc((prev) => (prev === example.videoSrc ? prev : example.videoSrc));
               }
            }
        } else if (msg.type === 'SET_VIDEO') {
            const { video_id, src } = msg.payload;
            const resolvedSrc = src || vrExamples.find((e) => e.id === video_id)?.videoSrc || null;
            if (resolvedSrc) {
              setCurrentVideoSrc((prev) => (prev === resolvedSrc ? prev : resolvedSrc));
              setMessage('');
            }
        } else if (msg.type === 'CONTROL') {
            const { command, time } = msg.payload;
            if (command === 'play') {
                await playerRef.current?.play();
            } else if (command === 'pause') {
                playerRef.current?.pause();
            } else if (command === 'seek') {
                playerRef.current?.seekTo(time);
            }
        }
      };

      ws.onerror = () => {
        ws?.close();
      };

      ws.onclose = () => {
        if (stopped) {
          return;
        }
        if (!hadSuccessfulConnection && attemptIndex < wsCandidates.length) {
          connect(attemptIndex);
          return;
        }
        scheduleReconnect();
      };
    };

    connect(0);

    return () => {
      stopped = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      ws?.close();
    };
  }, [sessionId]);

  const canMountPlayer = status === 'connected' && Boolean(currentVideoSrc);

  if (!canMountPlayer) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Sabina VR Therapy</h1>
            <p className="text-slate-400">{message}</p>
            <p className="text-xs text-slate-600 mt-8">Status: {status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-slate-300">
              Loading VR player...
            </div>
          }
        >
          <VR360Player
              ref={playerRef}
              src={currentVideoSrc as string}
              title="VR Session"
              className="w-full h-full"
          />
        </Suspense>
        {/* Overlay for status (optional, maybe hidden in VR) */}
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {status}
        </div>
    </div>
  );
}
