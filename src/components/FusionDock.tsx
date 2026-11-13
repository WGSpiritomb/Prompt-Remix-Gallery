import { useMemo } from 'react';
import {
  Shuffle,
  X,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { StylePreset } from '../types';
import { ImageWithFallback } from './ArtworkPlaceholder';
import {
  getSharedArtists,
  isBaseStyleIgnoredForMixing,
  isAlreadyMixedFusion,
} from '../utils/styleCombiner';

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
  styleA,
  styleB,
  onClearStyleA,
  onClearStyleB,
  onClearAll,
  onOpenCombiner,
  onRandomizePair,
}: FusionDockProps) {
  const hasAnySelected = Boolean(styleA || styleB);
  const hasBothSelected = Boolean(styleA && styleB);

  const sharedArtists = useMemo(
    () => (styleA && styleB ? getSharedArtists(styleA, styleB) : []),
    [styleA, styleB]
  );
  const hasCommonArtist = sharedArtists.length > 0;
  const isBaseA = isBaseStyleIgnoredForMixing(styleA);
  const isBaseB = isBaseStyleIgnoredForMixing(styleB);
  const hasBaseConflict = isBaseA || isBaseB;

  const isMixedA = isAlreadyMixedFusion(styleA);
  const isMixedB = isAlreadyMixedFusion(styleB);
  const hasMixedConflict = isMixedA || isMixedB;
  const hasAnyConflict = hasBaseConflict || hasMixedConflict || hasCommonArtist;

  if (!hasAnySelected) {
    return null;
  }

  return (
    <aside
      aria-label="Style combiner dock"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-3xl transition-all duration-200"
    >
      <div className="bg-[#09090b]/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-3 shadow-2xl shadow-black">
        <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-zinc-800/80">
          <p className="text-xs text-zinc-400 truncate">
            {hasBaseConflict ? (
              <span className="text-amber-400 font-medium">
                {isBaseA ? styleA?.name : styleB?.name} is a Base preset and cannot be mixed.
              </span>
            ) : hasMixedConflict ? (
              <span className="text-amber-400 font-medium">
                {isMixedA ? styleA?.name : styleB?.name} is already a fusion and cannot be mixed.
              </span>
            ) : hasCommonArtist ? (
              <span className="text-rose-400 font-medium">
                Styles share artist ({sharedArtists.join(', ')}). Pick a different partner.
              </span>
            ) : !hasBothSelected ? (
              <span className="text-zinc-300">
                <strong className="text-white font-semibold">1 style selected</strong> · Pick another or open combiner to roll partners
              </span>
            ) : (
              <span className="text-zinc-300">
                <strong className="text-white font-semibold">Ready to combine</strong> · Both styles distinct
              </span>
            )}
          </p>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              id="dock-random-btn"
              onClick={onRandomizePair}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              title="Pick 2 random compatible styles"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Random Pair</span>
            </button>

            <button
              type="button"
              id="dock-clear-all-btn"
              onClick={onClearAll}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Style A Slot */}
          <div className="flex-1 w-full sm:w-auto min-w-0">
            {styleA ? (
              <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                    <ImageWithFallback
                      src={styleA.image_url}
                      alt={styleA.name}
                      name={styleA.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-400 block">
                      Style A
                    </span>
                    <p className="text-xs font-semibold text-white truncate">{styleA.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="remove-slot-a-btn"
                  onClick={onClearStyleA}
                  className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 shrink-0 transition-colors"
                  title="Remove Style A"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="select-slot-a-btn"
                onClick={() => onOpenCombiner(null, styleB)}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium"
              >
                <span>Choose Style A</span>
              </button>
            )}
          </div>

          <span className="text-xs font-mono text-zinc-600 shrink-0">+</span>

          {/* Style B Slot */}
          <div className="flex-1 w-full sm:w-auto min-w-0">
            {styleB ? (
              <div className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                    <ImageWithFallback
                      src={styleB.image_url}
                      alt={styleB.name}
                      name={styleB.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-purple-400 block">
                      Style B
                    </span>
                    <p className="text-xs font-semibold text-white truncate">{styleB.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="remove-slot-b-btn"
                  onClick={onClearStyleB}
                  className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 shrink-0 transition-colors"
                  title="Remove Style B"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="select-slot-b-btn"
                onClick={() => onOpenCombiner(styleA, null)}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-600 bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-medium"
              >
                <span>Choose Style B</span>
              </button>
            )}
          </div>

          {/* Open Combiner CTA */}
          <div className="w-full sm:w-auto shrink-0">
            <button
              type="button"
              id="open-fusion-studio-btn"
              onClick={() => onOpenCombiner(styleA, styleB)}
              disabled={hasAnyConflict}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors ${
                hasAnyConflict
                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed'
                  : 'text-white bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {hasAnyConflict ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {hasBaseConflict
                      ? 'Base Excluded'
                      : hasMixedConflict
                      ? 'Fusion Excluded'
                      : 'Shared Artist'}
                  </span>
                </>
              ) : (
                <>
                  <span>{hasBothSelected ? 'Open Combiner' : 'Open & Pair'}</span>
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
