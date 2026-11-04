import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Volume2,
  VolumeX,
  FileText,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  Code,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { GeneratedScreenData, ScreenCaptureRecord } from '../types';

interface ContentGeneratorProps {
  currentCapture: ScreenCaptureRecord | null;
  history: ScreenCaptureRecord[];
  isGenerating: boolean;
  onSelectCapture: (record: ScreenCaptureRecord) => void;
  onTriggerGenerate: () => void;
  isSharing: boolean;
  canGenerate: boolean;
}

export const ContentGenerator: React.FC<ContentGeneratorProps> = ({
  currentCapture,
  history,
  isGenerating,
  onSelectCapture,
  onTriggerGenerate,
  isSharing,
  canGenerate,
}) => {
  const [activeTab, setActiveTab] = useState<'solution' | 'ocr' | 'frame'>('solution');
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Text to speech for discreet auditory answers
  const speakAnswer = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = async (text: string, type: 'answer' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'answer') {
        setCopiedAnswer(true);
        setTimeout(() => setCopiedAnswer(false), 2000);
      } else {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      }
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  const data: GeneratedScreenData | undefined = currentCapture?.data;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
      {/* Header & Main Generator Button */}
      <div className="p-3.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
              Screen-to-Text Generator
              {data && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {data.confidence ? `${data.confidence}% Confidence` : 'READY'}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-zinc-400">Real-time OCR extraction & instant problem solver</p>
          </div>
        </div>

        {/* Primary Screen to Text Action Button */}
        <button
          onClick={onTriggerGenerate}
          disabled={!isSharing || isGenerating || !canGenerate}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all ${
            isSharing && canGenerate
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:brightness-110 text-white shadow-emerald-600/20 cursor-pointer'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Screen...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Text & Answers</span>
            </>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      {isGenerating ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>
            <span className="absolute -inset-1 rounded-2xl bg-emerald-500/20 animate-ping" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-200">Processing Shared Screen Frame</p>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Extracting all text, question structure, mathematical formulas, and calculating verified solutions...
            </p>
          </div>
        </div>
      ) : !currentCapture ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3 text-center text-zinc-500">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-zinc-400">No Screen Content Generated Yet</p>
          <p className="text-xs text-zinc-500 max-w-sm">
            {isSharing
              ? 'Press &quot;Generate Text &amp; Answers&quot; or use the button on the live screen viewer to convert whatever is on screen into text.'
              : 'Start sharing your screen to begin capturing content.'}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sub-tabs: Solution, Raw OCR, Frame */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1 bg-zinc-900/60 border-b border-zinc-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('solution')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'solution'
                    ? 'bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                🧠 Verified Solution & Answer
              </button>
              <button
                onClick={() => setActiveTab('ocr')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'ocr'
                    ? 'bg-zinc-800 text-indigo-400 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                📝 Raw Extracted OCR
              </button>
              {currentCapture.thumbnailBase64 && (
                <button
                  onClick={() => setActiveTab('frame')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'frame'
                      ? 'bg-zinc-800 text-amber-400 border border-zinc-700 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  🔍 Captured Frame
                </button>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {data?.recommendedAnswer && (
                <button
                  onClick={() => speakAnswer(data.recommendedAnswer!)}
                  title={isSpeaking ? 'Stop Audio Whisper' : 'Listen via Audio Whisper (TTS)'}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    isSpeaking
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:text-emerald-400'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                onClick={() => copyToClipboard(data?.recommendedAnswer || data?.extractedText || '', 'answer')}
                title="Copy Solution to Clipboard"
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
              >
                {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="font-mono text-[11px]">{copiedAnswer ? 'Copied' : 'Copy Answer'}</span>
              </button>
            </div>
          </div>

          {/* Tab Views */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'solution' && data && (
              <div className="space-y-4">
                {/* Highlighted Direct Answer Banner */}
                {data.recommendedAnswer && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-zinc-900 border border-emerald-500/40 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-mono text-emerald-400 mb-1.5">
                      <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Direct Verified Answer
                      </span>
                      {data.confidence && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          {data.confidence}% CERTAINTY
                        </span>
                      )}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-white tracking-wide font-mono select-all">
                      {data.recommendedAnswer}
                    </div>
                  </div>
                )}

                {/* Detected Question Statement */}
                {data.detectedQuestion && (
                  <div className="p-3.5 rounded-lg bg-zinc-900/80 border border-zinc-800">
                    <div className="text-[11px] font-mono text-zinc-400 uppercase mb-1">Detected Question / Prompt</div>
                    <div className="text-xs sm:text-sm text-zinc-200 font-medium whitespace-pre-wrap">
                      {data.detectedQuestion}
                    </div>
                  </div>
                )}

                {/* Multiple-Choice Options Analysis (if applicable) */}
                {data.optionsAnalysis && data.optionsAnalysis.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      Option Analysis Breakdown
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {data.optionsAnalysis.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border flex items-start gap-2.5 text-xs ${
                            opt.status === 'Correct'
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <span
                            className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                              opt.status === 'Correct'
                                ? 'bg-emerald-500 text-zinc-950'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {opt.option}
                          </span>
                          <div className="flex-1">
                            <div className="font-semibold text-zinc-100">{opt.text}</div>
                            {opt.reason && <p className="text-[11px] text-zinc-400 mt-0.5">{opt.reason}</p>}
                          </div>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              opt.status === 'Correct'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {opt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step-by-Step Explanation */}
                {data.explanation && (
                  <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                    <div className="text-[11px] font-mono text-zinc-400 uppercase">Step-by-Step Derivation &amp; Proof</div>
                    <div className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-sans">
                      {data.explanation}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OCR Tab */}
            {activeTab === 'ocr' && data && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-400">
                    COMPLETE SCREEN TRANSCRIPTION ({data.extractedText.length} characters)
                  </span>
                  <button
                    onClick={() => copyToClipboard(data.extractedText, 'all')}
                    className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 hover:text-indigo-300"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAll ? 'Copied All' : 'Copy Verbatim Text'}</span>
                  </button>
                </div>
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed select-all">
                  {data.extractedText || 'No text extracted.'}
                </div>
              </div>
            )}

            {/* Frame Snapshot Tab */}
            {activeTab === 'frame' && currentCapture.thumbnailBase64 && (
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-zinc-400">
                  CAPTURED FRAME AT {new Date(currentCapture.createdAt).toLocaleTimeString()}
                </div>
                <div className="rounded-lg overflow-hidden border border-zinc-800 bg-black">
                  <img
                    src={currentCapture.thumbnailBase64}
                    alt="Captured screen frame"
                    className="w-full h-auto object-contain max-h-[350px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom History Drawer (Thumbnail strip of session captures) */}
          {history.length > 1 && (
            <div className="p-2 bg-zinc-900/80 border-t border-zinc-800">
              <div className="flex items-center justify-between px-1 mb-1.5 text-[10px] font-mono text-zinc-400 uppercase">
                <span>Capture History ({history.length} items)</span>
                <span>Click thumbnail to inspect</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectCapture(item)}
                    className={`flex-shrink-0 relative rounded-md overflow-hidden border transition-all ${
                      item.id === currentCapture.id
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {item.thumbnailBase64 ? (
                      <img src={item.thumbnailBase64} alt="" className="w-16 h-10 object-cover" />
                    ) : (
                      <div className="w-16 h-10 bg-zinc-800 flex items-center justify-center text-[9px] font-mono text-zinc-400">
                        Capture
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-center text-zinc-300 py-0.5">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
