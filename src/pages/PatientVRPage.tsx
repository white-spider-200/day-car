import { useEffect, useRef, useState } from 'react';
import VR360Player, { VR360PlayerHandle } from '../components/VR360Player';
import { buildWebSocketUrls } from '../utils/api';
import { vrExamples } from '../data/vrExamples';

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
    let stopped = false;

    const connect = () => {
      if (stopped || attemptIndex >= wsCandidates.length) {
        setStatus('disconnected');
        setMessage('Session disconnected.');
        return;
      }

      const wsUrl = wsCandidates[attemptIndex++];
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
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
                   setCurrentVideoSrc(example.videoSrc);
               }
            }
        } else if (msg.type === 'SET_VIDEO') {
            const { src } = msg.payload;
            setCurrentVideoSrc(src); // Or look up by ID if src not passed
            setMessage('');
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
        connect();
      };
    };

    connect();

    return () => {
      stopped = true;
      ws?.close();
    };
  }, [sessionId]);

  if (!currentVideoSrc) {
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
        <VR360Player 
            ref={playerRef}
            src={currentVideoSrc} 
            title="VR Session" 
            className="w-full h-full"
        />
        {/* Overlay for status (optional, maybe hidden in VR) */}
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {status}
        </div>
    </div>
  );
}
