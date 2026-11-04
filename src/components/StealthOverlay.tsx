import React, { useState } from 'react';
import { EyeOff, X, Move, Sparkles, BookOpen, Search, ArrowLeft } from 'lucide-react';
import { ScreenCaptureRecord } from '../types';

interface StealthOverlayProps {
  isCamouflageActive: boolean;
  onExitCamouflage: () => void;
  currentCapture: ScreenCaptureRecord | null;
}

export const StealthOverlay: React.FC<StealthOverlayProps> = ({
  isCamouflageActive,
  onExitCamouflage,
  currentCapture,
}) => {
  const [hudOpacity, setHudOpacity] = useState<number>(85);
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);

  // If Camouflage Disguise Mode is active, render an innocent looking Developer Documentation page
  if (isCamouflageActive) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs overflow-y-auto select-none p-6">
        {/* Subtle Panic Escape Bar */}
        <div className="flex items-center justify-between border-b border-[#333] pb-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
            <span className="text-[#888] text-[11px] ml-2">docs.internal.system.io/reference/v2.1</span>
          </div>
          <button
            onClick={onExitCamouflage}
            className="text-[#666] hover:text-[#aaa] px-2 py-1 rounded border border-[#333] text-[10px]"
            title="Press Esc or click to return to OmniAssist"
          >
            [Esc] Exit Camouflage
          </button>
        </div>

        {/* Camouflage Fake Content */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="border-b border-[#333] pb-4">
            <h1 className="text-xl text-[#9cdcfe] font-sans font-bold">Standard Library Architecture &amp; Diagnostics</h1>
            <p className="text-[#6a9955] mt-1">// Auto-generated system documentation notes</p>
          </div>

          {/* If there's an active capture answer, embed it disguised as an innocuous code snippet comment! */}
          {currentCapture?.data?.recommendedAnswer && (
            <div className="p-4 rounded bg-[#252526] border border-[#3c3c3c]">
              <span className="text-[#6a9955] block font-mono">
                /* SYSTEM_STATUS: VERIFIED_PARAM_RESOLVE */
              </span>
              <p className="text-[#dcdcaa] font-bold text-sm my-1">
                const OPTIMAL_VAL = &quot;{currentCapture.data.recommendedAnswer}&quot;;
              </p>
              {currentCapture.data.explanation && (
                <p className="text-[#6a9955] text-[11px] leading-relaxed mt-1">
                  // Rationale: {currentCapture.data.explanation.slice(0, 300)}...
                </p>
              )}
            </div>
          )}

          <div className="space-y-3 text-[#cccccc] font-sans leading-relaxed">
            <h2 className="text-sm font-semibold text-[#4ec9b0]">1. Runtime Initialization Lifecycle</h2>
            <p>
              The runtime engine evaluates synchronous tasks in sequential batches before deferring asynchronous
              promises to the microtask queue. In distributed systems, worker threads communicate via message ports.
            </p>

            <h2 className="text-sm font-semibold text-[#4ec9b0]">2. Memory Allocation &amp; Buffer Pooling</h2>
            <p>
              Shared memory segments utilize contiguous buffers to avoid garbage collection overhead during rapid I/O operations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
