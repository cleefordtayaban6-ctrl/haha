import React, { useState, useEffect } from 'react';
import {
  Eye,
  Search,
  Monitor,
  Sparkles,
  Maximize2,
  ZoomIn,
  RefreshCw,
  Share2,
  CheckCircle2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { ScreenViewer } from './ScreenViewer';
import { ContentGenerator } from './ContentGenerator';
import { ScreenCaptureRecord, ScreenSession, GeneratedScreenData } from '../types';
import { useAuth } from '../context/AuthContext';

interface ViewerStudioProps {
  activeCapture: ScreenCaptureRecord | null;
  setActiveCapture: (record: ScreenCaptureRecord | null) => void;
}

export const ViewerStudio: React.FC<ViewerStudioProps> = ({
  activeCapture,
  setActiveCapture,
}) => {
  const { currentUser, profile } = useAuth();
  const [activeSessions, setActiveSessions] = useState<ScreenSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [roomInput, setRoomInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [captureHistory, setCaptureHistory] = useState<ScreenCaptureRecord[]>([]);

  // Fetch active sessions from Firestore
  useEffect(() => {
    const q = query(collection(db, 'sessions'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: ScreenSession[] = [];
      snapshot.forEach((d) => {
        const s = d.data() as ScreenSession;
        list.push(s);
      });
      setActiveSessions(list);
      if (list.length > 0 && !selectedSessionId) {
        setSelectedSessionId(list[0].sessionId);
      }
    });

    return () => unsub();
  }, [selectedSessionId]);

  // Listen to captures for selected session
  useEffect(() => {
    if (!selectedSessionId) return;

    const capturesRef = collection(db, 'sessions', selectedSessionId, 'captures');
    const unsub = onSnapshot(capturesRef, (snapshot) => {
      const list: ScreenCaptureRecord[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ScreenCaptureRecord);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCaptureHistory(list);
      if (list.length > 0 && !activeCapture) {
        setActiveCapture(list[0]);
      }
    });

    return () => unsub();
  }, [selectedSessionId, activeCapture, setActiveCapture]);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim()) {
      setSelectedSessionId(roomInput.trim().toUpperCase());
    }
  };

  const handleViewerGenerate = async (canvas: HTMLCanvasElement) => {
    if (!currentUser) return;
    setIsGenerating(true);

    try {
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.92);
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 160;
      thumbCanvas.height = 90;
      const tCtx = thumbCanvas.getContext('2d');
      if (tCtx) tCtx.drawImage(canvas, 0, 0, 160, 90);
      const thumbnailBase64 = thumbCanvas.toDataURL('image/jpeg', 0.7);

      const response = await fetch('/api/generate-from-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
          promptMode: 'solve',
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Failed to process screen image.');
      }

      const generatedData: GeneratedScreenData = resJson.data;
      const record: ScreenCaptureRecord = {
        id: 'viewer_cap_' + Date.now(),
        sessionId: selectedSessionId || 'LOCAL',
        authorUid: currentUser.uid,
        authorEmail: currentUser.email || '',
        thumbnailBase64,
        data: generatedData,
        createdAt: new Date().toISOString(),
      };

      setActiveCapture(record);
      setCaptureHistory((prev) => [record, ...prev]);
    } catch (err: any) {
      console.error('Viewer generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentSession = activeSessions.find((s) => s.sessionId === selectedSessionId);

  return (
    <div className="max-w-7xl mx-auto py-5 px-4 lg:px-6 space-y-5">
      {/* Viewer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Viewer Studio &amp; Remote Monitor
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  FULLSCREEN / MAXIMIZE READY
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Observe live shared screens with high-definition zoom and trigger text generation on demand.
              </p>
            </div>
          </div>
        </div>

        {/* Join Room Form */}
        <form onSubmit={handleJoinRoom} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter Room Code (e.g. ROOM-1234)"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 uppercase"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Connect Room
          </button>
        </form>
      </div>

      {/* Available Session Rooms Picker */}
      {activeSessions.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-500 font-mono text-[11px] whitespace-nowrap">Active Rooms:</span>
          {activeSessions.map((s) => (
            <button
              key={s.sessionId}
              onClick={() => setSelectedSessionId(s.sessionId)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[11px] border transition-all whitespace-nowrap ${
                selectedSessionId === s.sessionId
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${s.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <span>{s.sessionId}</span>
              <span className="text-zinc-500">({s.hostName || 'Presenter'})</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Viewer Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Screen Viewer with Maximize view option */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <ScreenViewer
            stream={null}
            isSharing={Boolean(currentSession?.isActive)}
            onCaptureAndGenerate={handleViewerGenerate}
            isGenerating={isGenerating}
            canGenerate={profile?.canGenerateText !== false}
            sessionTitle={currentSession?.title || `Connected Room: ${selectedSessionId || 'None'}`}
          />

          <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
            <Maximize2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-zinc-200 font-medium">Viewer Maximization Controls:</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Click &quot;Maximize&quot; on the top right of the player for in-window Theater View, or click the Fullscreen icon for true full monitor immersion. Use zoom buttons (up to 300%) to inspect tiny text, equations, or test questions.
              </p>
            </div>
          </div>
        </div>

        {/* Content Generator & Answers */}
        <div className="lg:col-span-5 h-[580px] lg:h-[680px]">
          <ContentGenerator
            currentCapture={activeCapture}
            history={captureHistory}
            isGenerating={isGenerating}
            onSelectCapture={(cap) => setActiveCapture(cap)}
            onTriggerGenerate={() => {
              const video = document.querySelector('video');
              if (video) {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 1920;
                canvas.height = video.videoHeight || 1080;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  handleViewerGenerate(canvas);
                }
              }
            }}
            isSharing={Boolean(currentSession?.isActive)}
            canGenerate={profile?.canGenerateText !== false}
          />
        </div>
      </div>
    </div>
  );
};
