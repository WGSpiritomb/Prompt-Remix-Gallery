import { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  Shuffle,
  X,
  ArrowRight,
  HelpCircle,
  Zap,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { StylePreset } from '../types';
import { ImageWithFallback } from './ArtworkPlaceholder';
import { getSharedArtists } from '../utils/styleCombiner';

interface FusionDockProps {
  presets: StylePreset[];
  styleA: StylePreset | null;
  styleB: StylePreset | null;
  onClearStyleA: () => void;
  onClearStyleB: () => void;
  onClearAll: () => void;
  onOpenCombiner: (styleA?: StylePreset | null, styleB?: StylePreset | null) => void;
  onRandomizePair: () => void;
  onOpenGuide: () => void;
}

export function FusionDock({
  presets,
  styleA,
  styleB,
  onClearStyleA,
  onClearStyleB,
  onClearAll,
  onOpenCombiner,
  onRandomizePair,
  onOpenGuide,
}: FusionDockProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const hasAnySelected = Boolean(styleA || styleB);
  const hasBothSelected = Boolean(styleA && styleB);

  const sharedArtists = useMemo(
    () => (styleA && styleB ? getSharedArtists(styleA, styleB) : []),
    [styleA, styleB]
  );
  const hasCommonArtist = sharedArtists.length > 0;

  // If no styles are selected, keep screen completely clean and uncluttered
  if (!hasAnySelected) {
    return null;
  }

  return (
    <aside
      aria-label="Style fusion dock"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-3xl transition-all duration-300"
    >
      <div className="bg-black/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-3 shadow-2xl shadow-black ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-purple-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  Mix 2 Styles
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      hasCommonArtist
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-purple-950 text-purple-300 border border-purple-800'
                    }`}
                  >
                    {hasCommonArtist ? 'Common Artist Conflict' : 'Active'}
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {hasCommonArtist ? (
                  <span className="text-rose-400 font-medium">
                    ⚠️ Styles share artist ({sharedArtists.join(', ')}). Styles A & B cannot share artists.
                  </span>
                ) : !hasBothSelected ? (
                  '1 style selected. Click "+ Blend" on another card or open combiner'
                ) : (
                  '2 distinct styles selected. Click "Mix Styles Now" to blend'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="dock-random-btn"
              onClick={onRandomizePair}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title="Pick 2 random styles to blend"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Random Pair</span>
            </button>

            <button
              id="dock-clear-all-btn"
              onClick={onClearAll}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors text-xs"
              title="Close and clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Styles Slots + Blend Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Style A Slot */}
          <div className="flex-1 w-full sm:w-auto">
            {styleA ? (
              <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-indigo-500/50 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0f1117] shrink-0 border border-slate-700">
                    <ImageWithFallback
                      src={styleA.image_url}
                      alt={styleA.name}
                      name={styleA.name}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono uppercase text-indigo-400 font-bold block">
                      Style A (Base)
                    </span>
                    <p className="text-xs font-bold text-white truncate">{styleA.name}</p>
                  </div>
                </div>
                <button
                  id="remove-slot-a-btn"
                  onClick={onClearStyleA}
                  className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 shrink-0"
                  title="Remove Style A"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="select-slot-a-btn"
                onClick={() => onOpenCombiner(null, styleB)}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/80 bg-slate-900/40 hover:bg-indigo-950/20 text-slate-400 hover:text-indigo-300 transition-all text-xs font-medium"
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-400">
                  A
                </span>
                <span>Click any card or Choose Style A</span>
              </button>
            )}
          </div>

          {/* Plus / Blend Icon Divider */}
          <div className="shrink-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg font-bold text-xs">
              +
            </div>
          </div>

          {/* Style B Slot */}
          <div className="flex-1 w-full sm:w-auto">
            {styleB ? (
              <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-900/90 border border-purple-500/50 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0f1117] shrink-0 border border-slate-700">
                    <ImageWithFallback
                      src={styleB.image_url}
                      alt={styleB.name}
                      name={styleB.name}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono uppercase text-purple-400 font-bold block">
                      Style B (Accent)
                    </span>
                    <p className="text-xs font-bold text-white truncate">{styleB.name}</p>
                  </div>
                </div>
                <button
                  id="remove-slot-b-btn"
                  onClick={onClearStyleB}
                  className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 shrink-0"
                  title="Remove Style B"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="select-slot-b-btn"
                onClick={() => onOpenCombiner(styleA, null)}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-purple-500/80 bg-slate-900/40 hover:bg-purple-950/20 text-slate-400 hover:text-purple-300 transition-all text-xs font-medium"
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-mono font-bold flex items-center justify-center text-slate-400">
                  B
                </span>
                <span>Click 2nd card or Choose Style B</span>
              </button>
            )}
          </div>

          {/* Main Action Button */}
          <div className="w-full sm:w-auto shrink-0">
            <button
              id="open-fusion-studio-btn"
              onClick={() => onOpenCombiner(styleA, styleB)}
              disabled={hasCommonArtist}
              title={
                hasCommonArtist
                  ? `Cannot blend: Styles share artist (${sharedArtists.join(', ')})`
                  : hasBothSelected
                  ? 'Blend these 2 styles'
                  : 'Open Fusion Studio'
              }
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                hasCommonArtist
                  ? 'bg-rose-950/60 border border-rose-700/60 text-rose-300 cursor-not-allowed opacity-80'
                  : 'text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 shadow-lg shadow-indigo-950/60 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {hasCommonArtist ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Cannot Mix (Shared Artist)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{hasBothSelected ? 'Blend Styles Now ✨' : 'Open Fusion Studio'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
