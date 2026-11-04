import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Monitor,
  Eye,
  LogOut,
  Users,
  EyeOff,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth, ROOT_ADMIN_EMAIL } from '../context/AuthContext';

interface HeaderProps {
  currentTab: 'screen' | 'admin' | 'viewer';
  setCurrentTab: (tab: 'screen' | 'admin' | 'viewer') => void;
  isStealthActive: boolean;
  toggleStealth: () => void;
  isSharing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  isStealthActive,
  toggleStealth,
  isSharing,
}) => {
  const { currentUser, profile, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100 px-4 lg:px-6 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentTab('screen')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-white">OmniAssist</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
                  v2.5 Pro
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">Screen Intelligence & OCR Copilot</p>
            </div>
          </div>

          {/* Stream Status indicator */}
          {isSharing ? (
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[11px] font-medium tracking-wide">STREAM ACTIVE</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600"></span>
              <span className="text-[11px]">STANDBY</span>
            </div>
          )}
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setCurrentTab('screen')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentTab === 'screen'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            <span>Screen Hub & OCR</span>
          </button>

          <button
            onClick={() => setCurrentTab('viewer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              currentTab === 'viewer'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Viewer Studio</span>
          </button>

          {/* Admin Tab: Dedicated highlight for cleefordtayaban6@gmail.com */}
          {isAdmin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentTab === 'admin'
                  ? 'bg-amber-950/60 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-amber-400/80 hover:text-amber-200 hover:bg-amber-950/30'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Management</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">ROOT</span>
            </button>
          )}
        </nav>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Stealth Mode Button */}
          <button
            onClick={toggleStealth}
            title={isStealthActive ? 'Disable Stealth Mode (Alt+H)' : 'Enable Stealth Camouflage (Alt+H)'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all border ${
              isStealthActive
                ? 'bg-violet-950/70 border-violet-500 text-violet-200 animate-pulse'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px]">
              {isStealthActive ? 'Stealth ON' : 'Stealth'}
            </span>
          </button>

          {/* User profile dropdown / info */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div className="flex items-center gap-2">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-300 font-medium">
                    {currentUser.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium text-zinc-200 truncate max-w-[130px]">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </p>
                    {isAdmin ? (
                      <span className="text-[9px] font-mono font-semibold px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {profile?.role || 'USER'}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[150px]">{currentUser.email}</p>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out of Google account"
                className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
