import { useState } from 'react';
import {
  Copy,
  Check,
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  CopyPlus,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Ban,
  Wand2,
  Layers,
  Zap,
} from 'lucide-react';
import { StylePreset } from '../types';
import { ImageWithFallback } from './ArtworkPlaceholder';

interface GalleryViewProps {
  presets: StylePreset[];
  selectedSlotAId?: string | null;
  selectedSlotBId?: string | null;
  onOpenLightbox: (preset: StylePreset) => void;
  onEditPreset: (preset: StylePreset) => void;
  onDeletePreset: (id: string) => void;
  onDuplicatePreset: (preset: StylePreset) => void;
  onToggleFavorite: (id: string) => void;
  onSelectArtist: (artist: string) => void;
  onSelectTag: (tag: string) => void;
  onTestInSandbox: (preset: StylePreset) => void;
  onOpenCombiner?: (preset: StylePreset) => void;
  onToggleSelectForFusion?: (preset: StylePreset) => void;
  onCopyText: (text: string, label: string) => void;
}

export function GalleryView({
  presets,
  selectedSlotAId,
  selectedSlotBId,
  onOpenLightbox,
  onEditPreset,
  onDeletePreset,
  onDuplicatePreset,
  onToggleFavorite,
  onSelectArtist,
  onSelectTag,
  onTestInSandbox,
  onOpenCombiner,
  onToggleSelectForFusion,
  onCopyText,
}: GalleryViewProps) {
  const [expandedNegatives, setExpandedNegatives] = useState<Record<string, boolean>>({});
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [copiedNegId, setCopiedNegId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const toggleNegative = (id: string) => {
    setExpandedNegatives(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPrompt = (preset: StylePreset) => {
    onCopyText(preset.prompt, `Prompt copied for "${preset.name}"`);
    setCopiedPromptId(preset.id);
    setTimeout(() => setCopiedPromptId(null), 1800);
  };

  const handleCopyNegative = (preset: StylePreset) => {
    onCopyText(preset.negative_prompt, `Negative prompt copied for "${preset.name}"`);
    setCopiedNegId(preset.id);
    setTimeout(() => setCopiedNegId(null), 1800);
  };

  if (presets.length === 0) {
    return (
      <div className="text-center py-20 bg-[#161b22] rounded-xl border border-dashed border-slate-800 p-8">
        <div className="w-14 h-14 rounded-xl bg-[#0f1117] border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-200">No matching style presets found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Try clearing your search query or active artist/tag filters, or import a fresh styles.csv.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {presets.map((preset) => {
        const isNegativeExpanded = Boolean(expandedNegatives[preset.id]);
        const isMenuOpen = menuOpenId === preset.id;
        const isPromptCopied = copiedPromptId === preset.id;
        const isNegCopied = copiedNegId === preset.id;

        const isSelectedA = selectedSlotAId === preset.id;
        const isSelectedB = selectedSlotBId === preset.id;
        const isSelectedForFusion = isSelectedA || isSelectedB;

        return (
          <div
            key={preset.id}
            id={`preset-card-${preset.id}`}
            className={`group flex flex-col liquid-glass-card rounded-2xl overflow-hidden transition-all duration-200 ${
              isSelectedA
                ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-950/50'
                : isSelectedB
                ? 'border-purple-500 ring-2 ring-purple-500/40 shadow-purple-950/50'
                : 'border-white/[0.08] hover:border-indigo-500/40'
            }`}
          >
            {/* Thumbnail Header with Lightbox Trigger & Overlays */}
            <div className="relative aspect-[16/10] w-full bg-[#0b0f17] overflow-hidden">
              <ImageWithFallback
                src={preset.image_url}
                alt={preset.name}
                name={preset.name}
                artists={preset.derivedArtists}
                tags={preset.derivedTags}
                className="w-full h-full"
                onClick={() => onOpenLightbox(preset)}
              />

              {/* Top Controls Overlay */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
                {/* Favorite Star Button & Badges */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  <button
                    id={`favorite-btn-${preset.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(preset.id);
                    }}
                    className={`p-1.5 rounded-xl liquid-glass-pill transition-all ${
                      preset.favorite
                        ? 'bg-amber-500/90 text-slate-950 shadow-md shadow-amber-950/50 border-amber-400'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    title={preset.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-3.5 h-3.5 ${preset.favorite ? 'fill-slate-950' : ''}`} />
                  </button>

                  {isSelectedA && (
                    <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-md">
                      Style A
                    </span>
                  )}

                  {isSelectedB && (
                    <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white shadow-md">
                      Style B
                    </span>
                  )}

                  {preset.isCombined && (
                    <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md">
                      Fusion
                    </span>
                  )}
                </div>

                {/* Lightbox Expand Icon badge & Menu */}
                <div className="flex items-center gap-1.5 pointer-events-auto">
                  {onToggleSelectForFusion && (
                    <button
                      id={`combine-quick-btn-${preset.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectForFusion(preset);
                      }}
                      className={`p-1.5 rounded-xl liquid-glass-pill transition-all ${
                        isSelectedForFusion
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'text-indigo-300 hover:text-white'
                      }`}
                      title={isSelectedForFusion ? 'Remove from blend' : 'Add to 2-Style Blend'}
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    id={`lightbox-btn-${preset.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLightbox(preset);
                    }}
                    className="p-1.5 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition-colors"
                    title="Open Fullscreen Lightbox"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative">
                    <button
                      id={`card-menu-btn-${preset.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : preset.id);
                      }}
                      className="p-1.5 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition-colors"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Context Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        className="absolute right-0 mt-1.5 w-44 liquid-glass-modal rounded-xl shadow-2xl p-1 z-30 animate-in fade-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {onOpenCombiner && (
                          <button
                            id={`card-menu-combine-${preset.id}`}
                            onClick={() => {
                              setMenuOpenId(null);
                              onOpenCombiner(preset);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-indigo-300"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Combine Style</span>
                          </button>
                        )}
                        <button
                          id={`card-menu-sandbox-${preset.id}`}
                          onClick={() => {
                            setMenuOpenId(null);
                            onTestInSandbox(preset);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-indigo-300"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Test in Sandbox</span>
                        </button>
                        <button
                          id={`card-menu-edit-${preset.id}`}
                          onClick={() => {
                            setMenuOpenId(null);
                            onEditPreset(preset);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-indigo-300"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Edit Preset</span>
                        </button>
                        <button
                          id={`card-menu-duplicate-${preset.id}`}
                          onClick={() => {
                            setMenuOpenId(null);
                            onDuplicatePreset(preset);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-indigo-300"
                        >
                          <CopyPlus className="w-3.5 h-3.5 text-slate-400" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          id={`card-menu-delete-${preset.id}`}
                          onClick={() => {
                            setMenuOpenId(null);
                            onDeletePreset(preset.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 border-t border-slate-800 mt-1 pt-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
              {/* Preset Title & Extracted Artist Badges */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3
                    onClick={() => onOpenLightbox(preset)}
                    className="text-sm font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors line-clamp-1"
                    title={preset.name}
                  >
                    {preset.name}
                  </h3>
                  {preset.combineCount !== undefined && preset.combineCount > 0 && (
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      {preset.combineCount}
                    </span>
                  )}
                </div>

                {/* Artists and Tags Badges */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {preset.derivedArtists && preset.derivedArtists.length > 0 && (
                    preset.derivedArtists.map((artist) => (
                      <button
                        key={artist}
                        id={`card-artist-filter-${preset.id}-${artist.replace(/\s+/g, '')}`}
                        onClick={() => onSelectArtist(artist)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/50 transition-colors"
                        title={`Filter by artist: ${artist}`}
                      >
                        by {artist}
                      </button>
                    ))
                  )}

                  {preset.derivedTags && preset.derivedTags.slice(0, 2).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => onSelectTag(tag)}
                      className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-700"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Section */}
              <div className="space-y-2">
                <div className="bg-[#0f1117] rounded-lg p-2.5 border border-slate-800">
                  <div className="flex items-center justify-between mb-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-indigo-400">
                      <Sparkles className="w-3 h-3" />
                      Positive Prompt
                    </span>
                    <button
                      id={`copy-prompt-btn-${preset.id}`}
                      onClick={() => handleCopyPrompt(preset)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                        isPromptCopied
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      {isPromptCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 font-mono line-clamp-3 leading-relaxed break-words selection:bg-indigo-500/30">
                    {preset.prompt || <span className="text-slate-600 italic">No prompt provided</span>}
                  </p>
                </div>

                {/* Negative Prompt (Collapsible) */}
                {preset.negative_prompt && (
                  <div className="bg-[#0f1117] rounded-lg border border-slate-800 overflow-hidden">
                    <div
                      onClick={() => toggleNegative(preset.id)}
                      className="px-2.5 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors text-[10px] font-bold uppercase tracking-wider text-slate-500"
                    >
                      <span className="flex items-center gap-1 text-rose-400/90">
                        <Ban className="w-3 h-3" />
                        Negative Prompt
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          id={`copy-negative-btn-${preset.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyNegative(preset);
                          }}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                            isNegCopied
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'hover:text-slate-200 text-slate-500'
                          }`}
                          title="Copy Negative Prompt"
                        >
                          {isNegCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        {isNegativeExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {isNegativeExpanded && (
                      <div className="px-2.5 pb-2 pt-0 border-t border-slate-800">
                        <p className="text-xs text-slate-400 font-mono line-clamp-4 leading-relaxed break-words mt-1 selection:bg-rose-500/30">
                          {preset.negative_prompt}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Quick Test Sandbox & Combine Button */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    id={`sandbox-quick-btn-${preset.id}`}
                    onClick={() => onTestInSandbox(preset)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-indigo-300 transition-colors"
                  >
                    <Wand2 className="w-3 h-3 text-indigo-400" />
                    <span>Sandbox</span>
                  </button>

                  {onToggleSelectForFusion ? (
                    <button
                      id={`combine-bottom-btn-${preset.id}`}
                      onClick={() => onToggleSelectForFusion(preset)}
                      className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition-all ${
                        isSelectedForFusion
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                          : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800'
                      }`}
                      title={isSelectedForFusion ? 'Selected for blend' : 'Select for 2-style blend'}
                    >
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>{isSelectedA ? 'Style A (Base)' : isSelectedB ? 'Style B (Accent)' : '+ Blend'}</span>
                    </button>
                  ) : onOpenCombiner ? (
                    <button
                      id={`combine-bottom-btn-${preset.id}`}
                      onClick={() => onOpenCombiner(preset)}
                      className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-purple-300 transition-colors ml-1"
                    >
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>Combine</span>
                    </button>
                  ) : null}
                </div>

                <span className="text-[10px] text-slate-500 font-mono">
                  {preset.prompt.split(/\s+/).filter(Boolean).length} tokens
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

