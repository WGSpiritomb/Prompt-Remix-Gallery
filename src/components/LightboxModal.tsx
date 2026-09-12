import { useEffect, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Star,
  Sparkles,
  Ban,
  Trash2,
  Edit2,
  Users,
  Tag,
  Layers,
} from 'lucide-react';
import { StylePreset } from '../types';
import { ImageWithFallback } from './ArtworkPlaceholder';
import { isBaseStyleIgnoredForMixing, isAlreadyMixedFusion } from '../utils/styleCombiner';

interface LightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: StylePreset | null;
  presetsList: StylePreset[];
  onSelectPreset: (preset: StylePreset) => void;
  onEditPreset: (preset: StylePreset) => void;
  onDeletePreset?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenCombiner?: (preset: StylePreset) => void;
  onCopyText: (text: string, label: string) => void;
}

export function LightboxModal({
  isOpen,
  onClose,
  preset,
  presetsList,
  onSelectPreset,
  onEditPreset,
  onDeletePreset,
  onToggleFavorite,
  onOpenCombiner,
  onCopyText,
}: LightboxModalProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);

  // Keyboard navigation: Escape to close, Left/Right arrows to cycle
  useEffect(() => {
    if (!isOpen || !preset) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        navigatePrev();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, preset, presetsList]);

  if (!isOpen || !preset) return null;

  const currentIndex = presetsList.findIndex((p) => p.id === preset.id);

  const navigatePrev = () => {
    if (currentIndex > 0) {
      onSelectPreset(presetsList[currentIndex - 1]);
    } else if (presetsList.length > 0) {
      onSelectPreset(presetsList[presetsList.length - 1]);
    }
  };

  const navigateNext = () => {
    if (currentIndex < presetsList.length - 1) {
      onSelectPreset(presetsList[currentIndex + 1]);
    } else if (presetsList.length > 0) {
      onSelectPreset(presetsList[0]);
    }
  };

  const handleCopyPrompt = () => {
    onCopyText(preset.prompt, `Prompt copied for "${preset.name}"`);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1800);
  };

  const handleCopyNegative = () => {
    onCopyText(preset.negative_prompt, `Negative prompt copied for "${preset.name}"`);
    setCopiedNegative(true);
    setTimeout(() => setCopiedNegative(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md overflow-hidden animate-in fade-in"
      onClick={onClose}
    >
      {/* Lightbox Container */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-[#0f1117] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-lightbox-btn"
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-1.5 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Previous Button */}
        <button
          id="lightbox-prev-btn"
          onClick={navigatePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700 transition-colors"
          title="Previous Preset (Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Next Button */}
        <button
          id="lightbox-next-btn"
          onClick={navigateNext}
          className="absolute right-3 md:right-[420px] top-1/2 -translate-y-1/2 z-30 p-2 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700 transition-colors"
          title="Next Preset (Right Arrow)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Left Side: Artwork Media Preview */}
        <div className="md:flex-1 relative bg-[#0f1117] flex items-center justify-center min-h-[300px] md:min-h-[500px] max-h-[50vh] md:max-h-[85vh] overflow-hidden">
          <ImageWithFallback
            src={preset.image_url}
            alt={preset.name}
            name={preset.name}
            artists={preset.derivedArtists}
            tags={preset.derivedTags}
            className="w-full h-full object-contain max-h-[85vh]"
          />
        </div>

        {/* Right Side: Preset Details & Copiers */}
        <div className="w-full md:w-[420px] bg-[#161b22] border-t md:border-t-0 md:border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[85vh]">
          <div className="space-y-3.5">
            {/* Header: Title & Star */}
            <div className="flex items-start justify-between gap-3 pr-8">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Preset #{currentIndex + 1} of {presetsList.length}
                  </span>
                  {preset.isCombined && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 font-bold">
                      Fusion
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-white mt-1">{preset.name}</h2>
              </div>

              <button
                onClick={() => onToggleFavorite(preset.id)}
                className={`p-1.5 rounded-lg border transition-all ${
                  preset.favorite
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#0f1117] border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="Toggle Favorite"
              >
                <Star className={`w-4 h-4 ${preset.favorite ? 'fill-amber-400' : ''}`} />
              </button>
            </div>

            {/* Extracted Artists & Tags */}
            <div className="flex flex-wrap gap-1.5">
              {preset.derivedArtists?.map((artist) => (
                <span
                  key={artist}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-300 border border-indigo-500/30"
                >
                  <Users className="w-3 h-3" />
                  by {artist}
                </span>
              ))}
              {preset.derivedTags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                >
                  <Tag className="w-3 h-3 text-indigo-400" />
                  #{tag}
                </span>
              ))}
            </div>

            {/* Positive Prompt Block */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-indigo-400">
                  <Sparkles className="w-3 h-3" />
                  Positive Prompt
                </span>
                <button
                  id="lightbox-copy-prompt-btn"
                  onClick={handleCopyPrompt}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    copiedPrompt
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-indigo-400" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-2.5 bg-[#0f1117] rounded-lg border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed max-h-40 overflow-y-auto selection:bg-indigo-500/30">
                {preset.prompt}
              </div>
            </div>

            {/* Negative Prompt Block */}
            {preset.negative_prompt && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <Ban className="w-3 h-3" />
                    Negative Prompt
                  </span>
                  <button
                    id="lightbox-copy-neg-btn"
                    onClick={handleCopyNegative}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      copiedNegative
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {copiedNegative ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-rose-400" />
                        <span>Copy Negative</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 bg-[#0f1117] rounded-lg border border-slate-800 font-mono text-xs text-slate-400 leading-relaxed max-h-28 overflow-y-auto selection:bg-rose-500/30">
                  {preset.negative_prompt}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions Toolbar */}
          <div className="pt-3.5 mt-3.5 border-t border-zinc-800 flex items-center justify-between gap-2">
            {onOpenCombiner && !isBaseStyleIgnoredForMixing(preset) && !isAlreadyMixedFusion(preset) && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCombiner(preset);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-colors"
                title="Combine this style with another"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Combine Style</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {onDeletePreset && (
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${preset.name}"?`)) {
                      onDeletePreset(preset.id);
                      onClose();
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-950 text-rose-300 border border-rose-800/60 transition-colors"
                  title={preset.isCombined ? 'Delete Mix' : 'Delete Preset'}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>{preset.isCombined ? 'Delete Mix' : 'Delete'}</span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onEditPreset(preset);
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

