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
      <div className="text-center py-20 bg-zinc-950 rounded-2xl border border-zinc-800 p-8">
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
          <Sparkles className="w-5 h-5 text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-200">No styles or mixes found</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
          Try clearing filters or search queries, or mix new styles using the Style Creator.
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
            className={`group flex flex-col bg-zinc-950 rounded-2xl border transition-all duration-200 overflow-hidden ${
              isSelectedA
                ? 'border-indigo-500 ring-2 ring-indigo-500/40'
                : isSelectedB
                ? 'border-purple-500 ring-2 ring-purple-500/40'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {/* Thumbnail Header */}
            <div className="relative aspect-[16/10] w-full bg-black overflow-hidden">
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
                    className={`p-1.5 rounded-xl transition-all ${
                      preset.favorite
                        ? 'bg-amber-400 text-black shadow-md'
                        : 'bg-black/60 text-zinc-300 hover:text-white border border-white/10'
                    }`}
                    title={preset.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-3.5 h-3.5 ${preset.favorite ? 'fill-black' : ''}`} />
                  </button>

                  {isSelectedA && (
                    <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">
                      Style A
                    </span>
                  )}

                  {isSelectedB && (
                    <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-purple-600 text-white">
                      Style B
                    </span>
                  )}

                  {preset.isCombined && (
                    <span className="text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-purple-900/70 text-purple-200 border border-purple-700/50">
                      Mix
                    </span>
                  )}
                </div>

                {/* Direct Actions: Delete, Lightbox & Context Menu */}
                <div className="flex items-center gap-1 pointer-events-auto">
                  {/* Direct Delete Button right on card */}
                  <button
                    id={`quick-delete-btn-${preset.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePreset(preset.id);
                    }}
                    className="p-1.5 rounded-xl bg-black/60 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/60 border border-white/10 hover:border-rose-700/50 transition-colors"
                    title={preset.isCombined ? 'Delete Mix' : 'Delete Style'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Lightbox Button */}
                  <button
                    id={`lightbox-btn-${preset.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLightbox(preset);
                    }}
                    className="p-1.5 rounded-xl bg-black/60 text-zinc-400 hover:text-white border border-white/10 transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* 3-dots Menu */}
                  <div className="relative">
                    <button
                      id={`card-menu-btn-${preset.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(isMenuOpen ? null : preset.id);
                      }}
                      className="p-1.5 rounded-xl bg-black/60 text-zinc-400 hover:text-white border border-white/10 transition-colors"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Context Dropdown Menu */}
                    {isMenuOpen && (
                      <div
                        className="absolute right-0 mt-1.5 w-40 bg-zinc-950 rounded-xl border border-zinc-800 shadow-2xl p-1 z-30 animate-in fade-in"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {onOpenCombiner && (
                          <button
                            id={`card-menu-combine-${preset.id}`}
                            onClick={() => {
                              setMenuOpenId(null);
                              onOpenCombiner(preset);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 hover:text-indigo-300"
                          >
                            <Layers className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Combine Style</span>
                          </button>
                        )}
                        <button
                          id={`card-menu-edit-${preset.id}`}
                          onClick={() => {
                            setMenuOpenId(null);
                            onEditPreset(preset);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          id={`card-menu-duplicate-${preset.id}`}
                          onClick={() => {
                            setMenuOpenId(null);
                            onDuplicatePreset(preset);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        >
                          <CopyPlus className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          id={`card-menu-delete-${preset.id}`}
                          onClick={() => {
                            setMenuOpenId(null);
                            onDeletePreset(preset.id);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-950/40 border-t border-zinc-800 mt-1 pt-1.5"
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
            <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
              {/* Preset Title & Extracted Artist Badges */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3
                    onClick={() => onOpenLightbox(preset)}
                    className="text-sm font-semibold text-zinc-100 hover:text-indigo-300 cursor-pointer transition-colors line-clamp-1"
                    title={preset.name}
                  >
                    {preset.name}
                  </h3>
                  {preset.combineCount !== undefined && preset.combineCount > 0 && (
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0 flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-amber-400" />
                      {preset.combineCount}
                    </span>
                  )}
                </div>

                {/* Artists Badges */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {preset.derivedArtists && preset.derivedArtists.length > 0 && (
                    preset.derivedArtists.map((artist) => (
                      <button
                        key={artist}
                        id={`card-artist-filter-${preset.id}-${artist.replace(/\s+/g, '')}`}
                        onClick={() => onSelectArtist(artist)}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                        title={`Filter by artist: ${artist}`}
                      >
                        {artist.startsWith('@') ? artist : `by ${artist}`}
                      </button>
                    ))
                  )}

                  {preset.derivedTags && preset.derivedTags.slice(0, 2).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => onSelectTag(tag)}
                      className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Section */}
              <div className="space-y-2">
                <div className="bg-black rounded-xl p-2.5 border border-zinc-850 border-zinc-800/80">
                  <div className="flex items-center justify-between mb-1 text-[10px] text-zinc-400 font-medium">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      Prompt
                    </span>
                    <button
                      id={`copy-prompt-btn-${preset.id}`}
                      onClick={() => handleCopyPrompt(preset)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all ${
                        isPromptCopied
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {isPromptCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-300 font-mono line-clamp-3 leading-relaxed break-words">
                    {preset.prompt || <span className="text-zinc-600 italic">No prompt</span>}
                  </p>
                </div>

                {/* Negative Prompt (Collapsible) */}
                {preset.negative_prompt && (
                  <div className="bg-black rounded-xl border border-zinc-800/80 overflow-hidden">
                    <div
                      onClick={() => toggleNegative(preset.id)}
                      className="px-2.5 py-1.5 flex items-center justify-between cursor-pointer hover:bg-zinc-900 transition-colors text-[10px] font-medium text-zinc-400"
                    >
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Ban className="w-3 h-3 text-rose-400" />
                        Negative
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          id={`copy-negative-btn-${preset.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyNegative(preset);
                          }}
                          className="hover:text-zinc-200 text-zinc-500"
                          title="Copy Negative Prompt"
                        >
                          {isNegCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        {isNegativeExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                      </div>
                    </div>

                    {isNegativeExpanded && (
                      <div className="px-2.5 pb-2 pt-0 border-t border-zinc-800">
                        <p className="text-xs text-zinc-400 font-mono line-clamp-3 leading-relaxed break-words mt-1">
                          {preset.negative_prompt}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Row Actions */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {onToggleSelectForFusion ? (
                    <button
                      id={`combine-bottom-btn-${preset.id}`}
                      onClick={() => onToggleSelectForFusion(preset)}
                      className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg transition-all ${
                        isSelectedForFusion
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-400 hover:text-purple-300 hover:bg-zinc-900'
                      }`}
                      title={isSelectedForFusion ? 'Selected for blend' : 'Select for 2-style blend'}
                    >
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>{isSelectedA ? 'Style A' : isSelectedB ? 'Style B' : '+ Blend'}</span>
                    </button>
                  ) : onOpenCombiner ? (
                    <button
                      id={`combine-bottom-btn-${preset.id}`}
                      onClick={() => onOpenCombiner(preset)}
                      className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-purple-300 transition-colors"
                    >
                      <Layers className="w-3 h-3 text-purple-400" />
                      <span>Mix</span>
                    </button>
                  ) : null}

                  <button
                    id={`card-edit-btn-${preset.id}`}
                    onClick={() => onEditPreset(preset)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                    title="Edit Style"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id={`card-bottom-delete-btn-${preset.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePreset(preset.id);
                    }}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-rose-400 transition-colors"
                    title={preset.isCombined ? 'Delete Mix' : 'Delete Preset'}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

