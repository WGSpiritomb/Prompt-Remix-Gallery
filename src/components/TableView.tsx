import { useState } from 'react';
import {
  Copy,
  Check,
  Star,
  Edit2,
  Trash2,
  CopyPlus,
  Maximize2,
  Sparkles,
  Download,
  Layers,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { StylePreset } from '../types';
import { ImageWithFallback } from './ArtworkPlaceholder';
import { haveCommonArtists, getSharedArtists, isBaseStyleIgnoredForMixing, isAlreadyMixedFusion } from '../utils/styleCombiner';

interface TableViewProps {
  presets: StylePreset[];
  onOpenLightbox: (preset: StylePreset) => void;
  onEditPreset: (preset: StylePreset) => void;
  onDeletePreset: (id: string) => void;
  onDuplicatePreset: (preset: StylePreset) => void;
  onToggleFavorite: (id: string) => void;
  onSelectArtist?: (artist: string) => void;
  onSelectTag?: (tag: string) => void;
  onOpenCombiner?: (preset: StylePreset) => void;
  onOpenCombinerWithPair?: (styleA: StylePreset, styleB: StylePreset) => void;
  onCopyText: (text: string, label: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkExport?: (presets: StylePreset[]) => void;
}

export function TableView({
  presets,
  onOpenLightbox,
  onEditPreset,
  onDeletePreset,
  onDuplicatePreset,
  onToggleFavorite,
  onSelectArtist,
  onSelectTag,
  onOpenCombiner,
  onOpenCombinerWithPair,
  onCopyText,
  onBulkDelete,
  onBulkExport,
}: TableViewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<{ id: string; type: 'prompt' | 'negative' } | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.size === presets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(presets.map(p => p.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleCopy = (preset: StylePreset, type: 'prompt' | 'negative') => {
    const text = type === 'prompt' ? preset.prompt : preset.negative_prompt;
    const label = type === 'prompt' ? `Prompt for "${preset.name}"` : `Negative prompt for "${preset.name}"`;
    onCopyText(text, label);
    setCopiedField({ id: preset.id, type });
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleBulkExportSelected = () => {
    const selectedPresets = presets.filter(p => selectedIds.has(p.id));
    if (onBulkExport && selectedPresets.length > 0) {
      onBulkExport(selectedPresets);
    }
  };

  const handleBulkDeleteSelected = () => {
    if (onBulkDelete && selectedIds.size > 0) {
      if (confirm(`Are you sure you want to delete ${selectedIds.size} selected presets?`)) {
        onBulkDelete(Array.from(selectedIds));
        setSelectedIds(new Set());
      }
    }
  };

  if (presets.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-800 p-8">
        <Sparkles className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-zinc-200">No presets to display in spreadsheet</h3>
        <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters or import your styles.csv.</p>
      </div>
    );
  }

  const allSelected = presets.length > 0 && selectedIds.size === presets.length;

  return (
    <div className="space-y-2.5">
      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/30 px-3.5 py-2 rounded-lg text-xs text-indigo-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">{selectedIds.size}</span> presets selected
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size === 2 && onOpenCombinerWithPair && (() => {
              const selectedArr = presets.filter((p) => selectedIds.has(p.id));
              if (selectedArr.length !== 2) return null;
              const hasBaseConflict = selectedArr.some(isBaseStyleIgnoredForMixing);
              const hasMixedConflict = selectedArr.some(isAlreadyMixedFusion);
              const hasConflict = haveCommonArtists(selectedArr[0], selectedArr[1]);
              const conflictArtists = hasConflict
                ? getSharedArtists(selectedArr[0], selectedArr[1])
                : [];

              return (
                <button
                  id="bulk-blend-selected-btn"
                  onClick={() => {
                    if (hasConflict || hasBaseConflict || hasMixedConflict) return;
                    onOpenCombinerWithPair(selectedArr[0], selectedArr[1]);
                  }}
                  disabled={hasConflict || hasBaseConflict || hasMixedConflict}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold transition-all ${
                    hasConflict || hasBaseConflict || hasMixedConflict
                      ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-70'
                      : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/50 border border-purple-400/30 hover:scale-105'
                  }`}
                  title={
                    hasBaseConflict
                      ? 'Cannot blend: Base styles with leading numbers are excluded from mixing'
                      : hasMixedConflict
                      ? 'Cannot blend: Already mixed fusions are excluded from mixing'
                      : hasConflict
                      ? `Cannot blend: Styles share artist (${conflictArtists.join(', ')})`
                      : 'Blend these 2 selected styles together'
                  }
                >
                  {hasBaseConflict ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cannot Mix (Base Style)</span>
                    </>
                  ) : hasMixedConflict ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cannot Mix (Already Mixed)</span>
                    </>
                  ) : hasConflict ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cannot Mix (Shared Artist)</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-3.5 h-3.5" />
                      <span>Blend Selected 2 Styles</span>
                    </>
                  )}
                </button>
              );
            })()}

            {onBulkExport && (
              <button
                id="bulk-export-selected-btn"
                onClick={handleBulkExportSelected}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Selected</span>
              </button>
            )}
            {onBulkDelete && (
              <button
                id="bulk-delete-selected-btn"
                onClick={handleBulkDeleteSelected}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-zinc-800 bg-black text-zinc-400 font-semibold uppercase tracking-wider text-[10px] select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all presets"
                    className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 w-14 text-center">Preview</th>
                <th className="py-3 px-3 w-52">Style Name</th>
                <th className="py-3 px-3 min-w-[300px]">Positive Prompt</th>
                <th className="py-3 px-3 min-w-[240px]">Negative Prompt</th>
                <th className="py-3 px-3 w-32 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-800 font-mono">
              {presets.map((preset, index) => {
                const isSelected = selectedIds.has(preset.id);
                const isPromptCopied = copiedField?.id === preset.id && copiedField.type === 'prompt';
                const isNegCopied = copiedField?.id === preset.id && copiedField.type === 'negative';

                return (
                  <tr
                    key={preset.id}
                    id={`table-row-${preset.id}`}
                    className={`group transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/30 hover:bg-indigo-950/40'
                        : index % 2 === 0
                        ? 'bg-black hover:bg-zinc-900/40'
                        : 'bg-zinc-950/60 hover:bg-zinc-900/40'
                    }`}
                  >
                    {/* Row Select */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(preset.id)}
                        aria-label={`Select preset ${preset.name}`}
                        className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                      />
                    </td>

                    {/* Thumbnail Preview */}
                    <td className="py-2.5 px-2 text-center">
                      <div
                        onClick={() => onOpenLightbox(preset)}
                        className="w-11 h-9 rounded overflow-hidden border border-slate-800 hover:border-indigo-500 cursor-pointer transition-all mx-auto shrink-0 relative group/thumb"
                        title="Click to preview artwork"
                      >
                        <ImageWithFallback
                          src={preset.image_url}
                          alt={preset.name}
                          name={preset.name}
                          artists={preset.derivedArtists}
                          tags={preset.derivedTags}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                          <Maximize2 className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </td>

                    {/* Name & Favorite */}
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <button
                          id={`table-fav-${preset.id}`}
                          onClick={() => onToggleFavorite(preset.id)}
                          className="text-slate-600 hover:text-amber-400 transition-colors shrink-0"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              preset.favorite ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors line-clamp-1 text-xs">
                              {preset.name}
                            </p>
                            {preset.isCombined && (
                              <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 shrink-0">
                                Fusion
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                            <span>{preset.prompt.split(/\s+/).filter(Boolean).length} tokens</span>
                            {preset.combineCount !== undefined && preset.combineCount > 0 && (
                              <span className="text-amber-400 flex items-center gap-0.5">
                                <Zap className="w-2.5 h-2.5" />
                                {preset.combineCount}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Positive Prompt with Copy Button */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed break-words flex-1 selection:bg-indigo-500/30">
                          {preset.prompt}
                        </p>
                        <button
                          id={`table-copy-prompt-${preset.id}`}
                          onClick={() => handleCopy(preset, 'prompt')}
                          className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-medium transition-all ${
                            isPromptCopied
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                          title="Copy Positive Prompt"
                        >
                          {isPromptCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="hidden sm:inline">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-indigo-400" />
                              <span className="hidden sm:inline">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Negative Prompt with Copy Button */}
                    <td className="py-2.5 px-3">
                      {preset.negative_prompt ? (
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed break-words flex-1 selection:bg-rose-500/30">
                            {preset.negative_prompt}
                          </p>
                          <button
                            id={`table-copy-negative-${preset.id}`}
                            onClick={() => handleCopy(preset, 'negative')}
                            className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-medium transition-all ${
                              isNegCopied
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                            }`}
                            title="Copy Negative Prompt"
                          >
                            {isNegCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="hidden sm:inline">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-rose-400" />
                                <span className="hidden sm:inline">Copy Neg</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic font-sans text-xs">None</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2.5 px-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1">
                        {onOpenCombiner && !isBaseStyleIgnoredForMixing(preset) && !isAlreadyMixedFusion(preset) && (
                          <button
                            id={`table-combine-${preset.id}`}
                            onClick={() => onOpenCombiner(preset)}
                            className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-purple-300 transition-colors"
                            title="Combine with another style"
                          >
                            <Layers className="w-3.5 h-3.5 text-purple-400" />
                          </button>
                        )}
                        <button
                          id={`table-edit-${preset.id}`}
                          onClick={() => onEditPreset(preset)}
                          className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
                          title="Edit Style Preset"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`table-duplicate-${preset.id}`}
                          onClick={() => onDuplicatePreset(preset)}
                          className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
                          title="Duplicate Preset"
                        >
                          <CopyPlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`table-delete-${preset.id}`}
                          onClick={() => onDeletePreset(preset.id)}
                          className="p-1 rounded bg-slate-800/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
                          title="Delete Preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

