import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Monitor,
  Maximize2,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  Zap,
} from 'lucide-react';
import { useAuth, ROOT_ADMIN_EMAIL } from '../context/AuthContext';

export const LoginSplash: React.FC = () => {
  const { loginWithGoogle, isLoading, authError } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-500 flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            OmniAssist
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto">
            Screen Intelligence, Instant OCR Text Generator &amp; Exam Copilot
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          <div className="space-y-1 text-center">
            <h2 className="text-sm font-semibold text-zinc-200">Google Authentication Required</h2>
            <p className="text-xs text-zinc-400">
              Sign in with your verified Google account to access live screen sharing and generator tools.
            </p>
          </div>

          {/* Auth Error Banner if any */}
          {authError && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <button
            onClick={loginWithGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {/* Google SVG Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
          </button>

          {/* Administrator note */}
          <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400/90 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrator Privileges</span>
            </div>
            <p>
              Account <span className="text-zinc-300 font-mono font-medium">{ROOT_ADMIN_EMAIL}</span> is configured as root system administrator with exclusive user management access.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-left text-xs">
          <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
              <Monitor className="w-3.5 h-3.5" />
              <span>Screen Sharing</span>
            </div>
            <p className="text-[11px] text-zinc-400">Real-time display capture with ultra-low latency.</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Maximize Viewer</span>
            </div>
            <p className="text-[11px] text-zinc-400">Theater mode, 300% zoom, &amp; fullscreen support.</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>OCR Generator</span>
            </div>
            <p className="text-[11px] text-zinc-400">1-click screen-to-text &amp; verified answer solver.</p>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>User Control</span>
            </div>
            <p className="text-[11px] text-zinc-400">Role-based access &amp; permission governance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
