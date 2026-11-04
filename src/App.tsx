import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { ScreenShareHub } from './components/ScreenShareHub';
import { ViewerStudio } from './components/ViewerStudio';
import { AdminPanel } from './components/AdminPanel';
import { LoginSplash } from './components/LoginSplash';
import { StealthOverlay } from './components/StealthOverlay';
import { ScreenCaptureRecord } from './types';
import { Sparkles, RefreshCw, X, Copy, Check, Eye } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, isLoading, isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<'screen' | 'viewer' | 'admin'>('screen');
  const [isStealthActive, setIsStealthActive] = useState<boolean>(false);
  const [activeCapture, setActiveCapture] = useState<ScreenCaptureRecord | null>(null);
  const [showFloatingHud, setShowFloatingHud] = useState<boolean>(false);
  const [hudCopied, setHudCopied] = useState<boolean>(false);

  // Global hotkeys (Alt+H for stealth disguise, Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setIsStealthActive((prev) => !prev);
      } else if (e.key === 'Escape' && isStealthActive) {
        setIsStealthActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStealthActive]);

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-400">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-mono tracking-wider uppercase text-zinc-300">Initializing OmniAssist...</p>
        <p className="text-[11px] text-zinc-500 mt-1">Connecting to authentication services</p>
      </div>
    );
  }

  // Not logged in -> Show Google Login Splash
  if (!currentUser) {
    return <LoginSplash />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative">
      {/* Camouflage Disguise Screen (Triggered by Alt+H or Stealth button) */}
      <StealthOverlay
        isCamouflageActive={isStealthActive}
        onExitCamouflage={() => setIsStealthActive(false)}
        currentCapture={activeCapture}
      />

      {/* Main Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isStealthActive={isStealthActive}
        toggleStealth={() => setIsStealthActive((prev) => !prev)}
        isSharing={false}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 pb-10">
        {currentTab === 'screen' && (
          <ScreenShareHub
            onStealthTrigger={() => setIsStealthActive(true)}
            activeCapture={activeCapture}
            setActiveCapture={setActiveCapture}
          />
        )}

        {currentTab === 'viewer' && (
          <ViewerStudio
            activeCapture={activeCapture}
            setActiveCapture={setActiveCapture}
          />
        )}

        {currentTab === 'admin' && <AdminPanel />}
      </main>

      {/* Floating Stealth Teleprompter HUD (Optional widget for overlaying on screen) */}
      {activeCapture?.data?.recommendedAnswer && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm">
          {!showFloatingHud ? (
            <button
              onClick={() => setShowFloatingHud(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-xs text-emerald-400 border border-emerald-500/40 shadow-xl backdrop-blur-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">Show Teleprompter HUD</span>
            </button>
          ) : (
            <div className="bg-zinc-950/95 border border-emerald-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 text-[10px] font-mono text-emerald-400 uppercase">
                <span className="flex items-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3" />
                  Live Answer Key
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      if (activeCapture?.data?.recommendedAnswer) {
                        await navigator.clipboard.writeText(activeCapture.data.recommendedAnswer);
                        setHudCopied(true);
                        setTimeout(() => setHudCopied(false), 2000);
                      }
                    }}
                    className="p-1 rounded text-zinc-400 hover:text-white"
                  >
                    {hudCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => setShowFloatingHud(false)}
                    className="p-1 rounded text-zinc-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="font-mono font-bold text-white text-sm select-all">
                {activeCapture.data.recommendedAnswer}
              </div>

              {activeCapture.data.detectedQuestion && (
                <div className="text-[11px] text-zinc-400 line-clamp-2">
                  {activeCapture.data.detectedQuestion}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
