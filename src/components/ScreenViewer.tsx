import React, { useRef, useState, useEffect } from 'react';
import {
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  PictureInPicture,
  Sparkles,
  Sliders,
  Expand,
  Shrink,
  Eye,
  Camera,
  SunMedium,
  Check,
} from 'lucide-react';
import { ViewerDisplaySettings } from '../types';

interface ScreenViewerProps {
  stream: MediaStream | null;
  isSharing: boolean;
  onCaptureAndGenerate: (canvas: HTMLCanvasElement) => void;
  isGenerating: boolean;
  canGenerate: boolean;
  sessionTitle?: string;
}

export const ScreenViewer: React.FC<ScreenViewerProps> = ({
  stream,
  isSharing,
  onCaptureAndGenerate,
  isGenerating,
  canGenerate,
  sessionTitle = 'Live Screen Broadcast',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [settings, setSettings] = useState<ViewerDisplaySettings>({
    isMaximized: false,
    isFullscreen: false,
    zoomLevel: 1,
    filterMode: 'normal',
    isPiP: false,
  });

  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState<boolean>(true);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Attach MediaStream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => console.warn('Video auto-play blocked:', err));
    } else if (videoRef.current && !stream) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Track video metadata resolution
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setSettings((prev) => ({
        ...prev,
        isFullscreen: Boolean(document.fullscreenElement),
      }));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle true Native Fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle error:', err);
    }
  };

  // Toggle In-Browser Maximize (Theater / Expanded View)
  const toggleMaximize = () => {
    setSettings((prev) => ({
      ...prev,
      isMaximized: !prev.isMaximized,
    }));
  };

  // Picture in Picture
  const togglePiP = async () => {
    try {
      if (videoRef.current) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setSettings((prev) => ({ ...prev, isPiP: false }));
        } else {
          await videoRef.current.requestPictureInPicture();
          setSettings((prev) => ({ ...prev, isPiP: true }));
        }
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setSettings((prev) => {
      const newZoom = Math.min(Math.max(prev.zoomLevel + delta, 1), 3);
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return { ...prev, zoomLevel: Number(newZoom.toFixed(2)) };
    });
  };

  const resetZoom = () => {
    setSettings((prev) => ({ ...prev, zoomLevel: 1 }));
    setPanPosition({ x: 0, y: 0 });
  };

  // Pan controls when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (settings.zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && settings.zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Capture current video frame onto canvas and send to generator
  const handleCaptureFrame = () => {
    if (!videoRef.current || !isSharing) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    // Use full native stream resolution (1080p, 4K, etc.)
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      onCaptureAndGenerate(canvas);
    }
  };

  // CSS Filter styles
  const getFilterStyle = () => {
    switch (settings.filterMode) {
      case 'high_contrast':
        return 'contrast(160%) brightness(105%)';
      case 'invert':
        return 'invert(100%) hue-rotate(180deg)';
      case 'sharp_monochrome':
        return 'grayscale(100%) contrast(180%)';
      default:
        return 'none';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col transition-all ${
        settings.isMaximized
          ? 'fixed inset-0 z-50 rounded-none border-0'
          : 'w-full h-[520px] lg:h-[620px]'
      }`}
      onMouseEnter={() => setShowControls(true)}
    >
      {/* Top Header / Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSharing ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <h3 className="font-semibold text-xs sm:text-sm text-zinc-100 truncate max-w-[200px] sm:max-w-md">
              {sessionTitle}
            </h3>
          </div>

          {videoDimensions.width > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 hidden sm:inline">
              {videoDimensions.width}x{videoDimensions.height}
            </span>
          )}

          {settings.zoomLevel > 1 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {Math.round(settings.zoomLevel * 100)}% ZOOM (Drag to pan)
            </span>
          )}
        </div>

        {/* Right Header: Fast Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Main Feature: Convert screen content to text button */}
          <button
            onClick={handleCaptureFrame}
            disabled={!isSharing || isGenerating || !canGenerate}
            title="Convert current screen content to text & solve (Alt+C)"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
              isSharing && canGenerate
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/20 animate-pulse'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">Convert Screen to Text</span>
            <span className="sm:hidden font-mono">OCR Text</span>
          </button>

          {/* Picture in Picture */}
          <button
            onClick={togglePiP}
            disabled={!isSharing}
            title="Picture in Picture Floating Window"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-40 transition-colors"
          >
            <PictureInPicture className="w-4 h-4" />
          </button>

          {/* In-Browser Maximize (Theater View) */}
          <button
            onClick={toggleMaximize}
            title={settings.isMaximized ? 'Restore View (Theater)' : 'Maximize View (Theater Mode)'}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              settings.isMaximized
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {settings.isMaximized ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
            <span className="hidden md:inline text-[11px] font-mono">
              {settings.isMaximized ? 'Restore' : 'Maximize'}
            </span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={settings.isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (F11)'}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            {settings.isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Video Stream Stage */}
      <div
        className={`relative flex-1 bg-black flex items-center justify-center overflow-hidden select-none ${
          settings.zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {isSharing ? (
          <div
            className="relative flex items-center justify-center w-full h-full"
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${settings.zoomLevel})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={handleLoadedMetadata}
              className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-2xl"
              style={{ filter: getFilterStyle() }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">No Active Screen Stream</p>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Click &quot;Start Screen Share&quot; in the Presenter panel or enter a session room code to begin real-time broadcasting.
              </p>
            </div>
          </div>
        )}

        {/* Scan line effect during generation */}
        {isGenerating && (
          <div className="absolute inset-0 pointer-events-none z-30 bg-emerald-500/5">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />
            <div className="absolute top-4 right-4 bg-zinc-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Scanning screen text & solving...</span>
            </div>
          </div>
        )}

        {/* Bottom Floating Viewer Control Bar */}
        {isSharing && (
          <div
            className={`absolute bottom-4 inset-x-0 mx-auto w-fit z-30 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-3 shadow-2xl transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-20 hover:opacity-100'
            }`}
          >
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 pr-3 border-r border-zinc-800">
              <button
                onClick={() => handleZoom(-0.25)}
                disabled={settings.zoomLevel <= 1}
                title="Zoom Out"
                className="p-1 rounded-md text-zinc-400 hover:text-white disabled:opacity-30"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-zinc-300 w-12 text-center">
                {Math.round(settings.zoomLevel * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.25)}
                disabled={settings.zoomLevel >= 3}
                title="Zoom In"
                className="p-1 rounded-md text-zinc-400 hover:text-white disabled:opacity-30"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {settings.zoomLevel > 1 && (
                <button
                  onClick={resetZoom}
                  title="Reset Zoom"
                  className="p-1 rounded-md text-zinc-400 hover:text-amber-400"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Contrast / Color Filters */}
            <div className="flex items-center gap-1 pr-3 border-r border-zinc-800">
              <SunMedium className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={settings.filterMode}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    filterMode: e.target.value as ViewerDisplaySettings['filterMode'],
                  }))
                }
                className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 rounded px-2 py-0.5 focus:outline-none"
              >
                <option value="normal">Default</option>
                <option value="high_contrast">High Contrast</option>
                <option value="invert">Invert (Dark/Light)</option>
                <option value="sharp_monochrome">Crisp Mono</option>
              </select>
            </div>

            {/* Big Instant Generate Button */}
            <button
              onClick={handleCaptureFrame}
              disabled={isGenerating || !canGenerate}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Capture & Solve</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
