import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Video,
  VideoOff,
  Sparkles,
  Share2,
  Users,
  Copy,
  Check,
  Play,
  Square,
  AlertTriangle,
  Info,
  Maximize2,
  Lock,
} from 'lucide-react';
import { ScreenViewer } from './ScreenViewer';
import { ContentGenerator } from './ContentGenerator';
import { useAuth, ROOT_ADMIN_EMAIL } from '../context/AuthContext';
import { ScreenCaptureRecord, GeneratedScreenData } from '../types';
import { doc, setDoc, onSnapshot, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface ScreenShareHubProps {
  onStealthTrigger: () => void;
  activeCapture: ScreenCaptureRecord | null;
  setActiveCapture: (record: ScreenCaptureRecord | null) => void;
}

export const ScreenShareHub: React.FC<ScreenShareHubProps> = ({
  onStealthTrigger,
  activeCapture,
  setActiveCapture,
}) => {
  const { currentUser, profile, isAdmin } = useAuth();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [captureHistory, setCaptureHistory] = useState<ScreenCaptureRecord[]>([]);
  const [sessionRoomId, setSessionRoomId] = useState<string>('ROOM-' + Math.floor(1000 + Math.random() * 9000));
  const [copiedRoomId, setCopiedRoomId] = useState<boolean>(false);
  const [streamStartTime, setStreamStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer for active stream duration
  useEffect(() => {
    let interval: any = null;
    if (isSharing && streamStartTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - streamStartTime) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isSharing, streamStartTime]);

  // Sync session room in Firestore
  useEffect(() => {
    if (!currentUser) return;

    const sessionRef = doc(db, 'sessions', sessionRoomId);
    setDoc(
      sessionRef,
      {
        sessionId: sessionRoomId,
        hostUid: currentUser.uid,
        hostEmail: currentUser.email || '',
        hostName: currentUser.displayName || 'Host',
        title: `${currentUser.displayName || 'User'}'s Screen Session`,
        isActive: isSharing,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => console.warn('Session sync notice:', err));
  }, [sessionRoomId, isSharing, currentUser]);

  // Listen for session captures in real time
  useEffect(() => {
    const capturesRef = collection(db, 'sessions', sessionRoomId, 'captures');
    const unsub = onSnapshot(
      capturesRef,
      (snapshot) => {
        const list: ScreenCaptureRecord[] = [];
        snapshot.forEach((d) => {
          const cap = d.data() as ScreenCaptureRecord;
          list.push(cap);
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (list.length > 0) {
          setCaptureHistory(list);
          if (!activeCapture) {
            setActiveCapture(list[0]);
          }
        }
      },
      (err) => console.warn('Captures listen notice:', err)
    );

    return () => unsub();
  }, [sessionRoomId, activeCapture, setActiveCapture]);

  // Start Screen Sharing via getDisplayMedia
  const startScreenShare = async () => {
    setErrorMessage(null);
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          cursor: 'always',
          frameRate: { ideal: 30, max: 60 },
        } as MediaTrackConstraints,
        audio: false,
      });

      // Handle user stopping screen share via native browser stop button
      mediaStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setStream(mediaStream);
      setIsSharing(true);
      setStreamStartTime(Date.now());
    } catch (err: any) {
      console.error('Failed to get display media:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Screen share permission was declined or dismissed.');
      } else {
        setErrorMessage(err.message || 'Could not start screen sharing.');
      }
    }
  };

  // Stop Screen Sharing
  const stopScreenShare = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsSharing(false);
    setStreamStartTime(null);
  };

  // Convert current screen canvas to text & send to server endpoint
  const handleCaptureAndGenerate = async (canvas: HTMLCanvasElement) => {
    if (!currentUser) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // Create high-res base64 image
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.92);

      // Create smaller thumbnail for history strip
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 160;
      thumbCanvas.height = 90;
      const tCtx = thumbCanvas.getContext('2d');
      if (tCtx) {
        tCtx.drawImage(canvas, 0, 0, 160, 90);
      }
      const thumbnailBase64 = thumbCanvas.toDataURL('image/jpeg', 0.7);

      // Call Express server endpoint
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
        throw new Error(resJson.error || 'Server failed to analyze screen image.');
      }

      const generatedData: GeneratedScreenData = resJson.data;

      const recordId = 'cap_' + Date.now();
      const newRecord: ScreenCaptureRecord = {
        id: recordId,
        sessionId: sessionRoomId,
        authorUid: currentUser.uid,
        authorEmail: currentUser.email || '',
        thumbnailBase64,
        data: generatedData,
        createdAt: new Date().toISOString(),
      };

      setActiveCapture(newRecord);
      setCaptureHistory((prev) => [newRecord, ...prev]);

      // Save record to Firestore subcollection for collaborative viewers
      const captureDocRef = doc(db, 'sessions', sessionRoomId, 'captures', recordId);
      await setDoc(captureDocRef, {
        ...newRecord,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('OCR & Generation failed:', err);
      setErrorMessage(err.message || 'Failed to extract text from screen.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(sessionRoomId);
      setCopiedRoomId(true);
      setTimeout(() => setCopiedRoomId(false), 2000);
    } catch (err) {
      console.error('Room ID copy failed:', err);
    }
  };

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const canShare = profile?.canShareScreen !== false;
  const canGenerate = profile?.canGenerateText !== false;

  return (
    <div className="max-w-7xl mx-auto py-5 px-4 lg:px-6 space-y-5">
      {/* Top Session & Screen Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-indigo-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">Screen Share &amp; Generator Studio</h1>
              {isSharing && (
                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE {formatElapsed(elapsedSeconds)}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400">Share your monitor, window, or browser tab with full text extraction</p>
          </div>
        </div>

        {/* Start / Stop Screen Share Controls */}
        <div className="flex items-center gap-2">
          {/* Room Code Badge */}
          <button
            onClick={copyRoomId}
            title="Click to copy Session Room ID for viewers"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 hover:border-zinc-700 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Room: {sessionRoomId}</span>
            {copiedRoomId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
          </button>

          {!isSharing ? (
            <button
              onClick={startScreenShare}
              disabled={!canShare}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-lg transition-all ${
                canShare
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Screen Share</span>
            </button>
          ) : (
            <button
              onClick={stopScreenShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/25 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Sharing</span>
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-950/70 border border-red-500/40 text-red-300 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Studio Grid: Left Screen Viewer (with Maximize option), Right OCR Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Screen Share Viewer (with Fullscreen, Theater Mode, Zoom & Pan) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <ScreenViewer
            stream={stream}
            isSharing={isSharing}
            onCaptureAndGenerate={handleCaptureAndGenerate}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
            sessionTitle={`Session ${sessionRoomId} • ${currentUser?.displayName || 'Host'}`}
          />

          {/* Quick instructions / Hotkey guide */}
          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">Alt+C</span>
              <span>Capture &amp; OCR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">Maximize</span>
              <span>Theater Zoom</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">PiP</span>
              <span>Floating Window</span>
            </div>
          </div>
        </div>

        {/* Right: Screen-to-Text Generator & AI Solutions */}
        <div className="lg:col-span-5 h-[580px] lg:h-[680px]">
          <ContentGenerator
            currentCapture={activeCapture}
            history={captureHistory}
            isGenerating={isGenerating}
            onSelectCapture={(cap) => setActiveCapture(cap)}
            onTriggerGenerate={() => {
              // Trigger capture via synthetic canvas
              const video = document.querySelector('video');
              if (video && isSharing) {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 1920;
                canvas.height = video.videoHeight || 1080;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  handleCaptureAndGenerate(canvas);
                }
              }
            }}
            isSharing={isSharing}
            canGenerate={canGenerate}
          />
        </div>
      </div>
    </div>
  );
};
