import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { vrExamples } from '../data/vrExamples';
import { apiJson, buildWebSocketUrls } from '../utils/api';

type SessionResponse = {
  session_id: string;
  join_url_patient: string;
  join_url_doctor: string;
};

export default function DoctorVRSessionPage() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [patientStatus, setPatientStatus] = useState<'offline' | 'online'>('offline');
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  const createSession = async () => {
    try {
      const data = await apiJson<SessionResponse>('/vr-sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: 'current-user', patient_id: 'anonymous' }),
      });
      setSession(data);
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  useEffect(() => {
    if (!session) return;

    const wsCandidates = buildWebSocketUrls(`/vr-sessions/${session.session_id}/doctor`);
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
        return;
      }

      setStatus('disconnected');
      attemptIndex = index + 1;
      ws = new WebSocket(wsCandidates[index]);

      ws.onopen = () => {
        activeIndex = index;
        hadSuccessfulConnection = true;
        reconnectDelayMs = 800;
        setStatus('connected');
        setSocket(ws);
        console.log('Doctor connected to VR session');
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'SYNC_STATE') {
            // Initial sync if needed
        } else if (msg.type === 'USER_LEFT') {
            if (msg.role === 'patient') setPatientStatus('offline');
        } else if (msg.type === 'USER_JOINED') {
            // We might need to implement USER_JOINED on backend to be precise,
            // but for now we can infer online if we get any msg from patient or just assume
            // Actually backend doesn't send USER_JOINED yet.
        }
      };

      ws.onerror = () => {
        ws?.close();
      };

      ws.onclose = () => {
        if (stopped) {
          return;
        }
        setStatus('disconnected');
        setSocket(null);
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
      setSocket(null);
    };
  }, [session]);

  const sendCommand = (type: string, payload: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    }
  };

  const handleSetVideo = (example: typeof vrExamples[0]) => {
    setCurrentVideoId(example.id);
    sendCommand('SET_VIDEO', { video_id: example.id, src: example.videoSrc });
  };

  const handleControl = (command: 'play' | 'pause') => {
    sendCommand('CONTROL', { command });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header brandHref="/doctor-dashboard" />

      <main className="section-shell py-8" dir={isAr ? 'rtl' : 'ltr'}>
        <h1 className="text-3xl font-black text-slate-900 mb-6">
          {isAr ? 'لوحة تحكم جلسة VR' : 'VR Session Control Panel'}
        </h1>

        {!session ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200">
            <p className="mb-6 text-lg text-slate-600">
              {isAr 
                ? 'ابدأ جلسة واقع افتراضي جديدة للتحكم في تجربة المريض عن بعد.' 
                : 'Start a new VR session to control the patient experience remotely.'}
            </p>
            <button
              onClick={createSession}
              className="px-8 py-3 rounded-xl bg-primary text-white font-bold shadow-lg hover:bg-primary/90 transition"
            >
              {isAr ? 'إنشاء جلسة جديدة' : 'Create New Session'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              {/* Session Info Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="font-bold text-slate-900 mb-4">{isAr ? 'معلومات الجلسة' : 'Session Info'}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">{isAr ? 'حالة الاتصال' : 'Connection Status'}</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-medium text-slate-700">{status === 'connected' ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">{isAr ? 'رابط المريض' : 'Patient Link'}</label>
                    <div className="mt-1 p-3 bg-slate-100 rounded-lg text-xs break-all font-mono border border-slate-200">
                      {window.location.origin}/vr-session/{session.session_id}/patient
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {isAr ? 'شارك هذا الرابط مع المريض ليفتحه في نظارة VR أو المتصفح.' : 'Share this link with the patient to open in VR headset or browser.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="font-bold text-slate-900 mb-4">{isAr ? 'التحكم' : 'Controls'}</h2>
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleControl('play')}
                        className="flex-1 py-3 rounded-xl bg-green-100 text-green-700 font-bold hover:bg-green-200"
                    >
                        Play
                    </button>
                    <button 
                        onClick={() => handleControl('pause')}
                        className="flex-1 py-3 rounded-xl bg-amber-100 text-amber-700 font-bold hover:bg-amber-200"
                    >
                        Pause
                    </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                 <h2 className="font-bold text-slate-900 mb-6">{isAr ? 'اختر السيناريو' : 'Select Scenario'}</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {vrExamples.map(example => (
                        <button
                            key={example.id}
                            onClick={() => handleSetVideo(example)}
                            className={`text-left p-4 rounded-xl border transition-all ${
                                currentVideoId === example.id 
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                : 'border-slate-200 hover:border-primary/50'
                            }`}
                        >
                            <div className={`h-24 rounded-lg bg-gradient-to-br ${example.palette} mb-3 flex items-center justify-center text-3xl`}>
                                {example.id === 'heights' ? '🏔️' : example.id === 'spiders' ? '🕷️' : example.id === 'flying' ? '✈️' : '👥'}
                            </div>
                            <h3 className="font-bold text-slate-900">{isAr ? example.titleAr : example.titleEn}</h3>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{isAr ? example.descriptionAr : example.descriptionEn}</p>
                        </button>
                    ))}
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
