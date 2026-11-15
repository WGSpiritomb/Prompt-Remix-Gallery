import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Layers,
  Trash2,
  RotateCcw,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { MainTab, StylePreset, StylePairCombination } from '../types';
import { computeLeaderboards } from '../utils/tagExtractor';
import { isFusionPreset } from '../utils/styleCombiner';
import { ImageWithFallback } from './ArtworkPlaceholder';

interface LeaderboardPanelProps {
  presets: StylePreset[];
  combinations?: StylePairCombination[];
  activeTab?: MainTab;
  selectedArtist: string | null;
  selectedTag?: string | null;
  onSelectArtist: (artist: string | null) => void;
  onSelectTag?: (tag: string | null) => void;
  onOpenCombiner?: (styleA?: StylePreset, styleB?: StylePreset) => void;
  onDeleteCombination?: (pairKey: string) => void;
  onClearAllCombinations?: () => void;
  onDeletePreset?: (presetId: string) => void;
  onDeleteAllSavedFusions?: () => void;
  onResetStyleCombineCount?: (presetId: string) => void;
  onResetAllCombineCounts?: () => void;
  onClose?: () => void;
}

export function LeaderboardPanel({
  presets,
  combinations = [],
  activeTab = 'styles',
  selectedArtist,
  onSelectArtist,
  onOpenCombiner,
  onDeleteCombination,
  onClearAllCombinations,
  onDeletePreset,
  onDeleteAllSavedFusions,
  onResetStyleCombineCount,
  onResetAllCombineCounts,
  onClose,
}: LeaderboardPanelProps) {
  const [boardScope, setBoardScope] = useState<MainTab>(activeTab);
  const [stylesTab, setStylesTab] = useState<'artists' | 'combined'>('artists');
  const [fusionsTab, setFusionsTab] = useState<'pairs' | 'saved'>('pairs');

  const [confirmClearCombos, setConfirmClearCombos] = useState(false);
  const [confirmDeleteFusions, setConfirmDeleteFusions] = useState(false);
  const [confirmResetCounts, setConfirmResetCounts] = useState(false);

  // Sync leaderboard scope automatically when user switches main Styles / Fusions tab
  useEffect(() => {
    setBoardScope(activeTab);
    setConfirmClearCombos(false);
    setConfirmDeleteFusions(false);
    setConfirmResetCounts(false);
  }, [activeTab]);

  // Separate non-fusion styles and saved fusions cleanly
  const stylePresets = useMemo(
    () => presets.filter((p) => !isFusionPreset(p)),
    [presets]
  );

  const fusionPresets = useMemo(
    () => presets.filter(isFusionPreset),
    [presets]
  );

  // Compute artist rankings strictly from non-fusion style presets
  const { topArtists } = useMemo(
    () => computeLeaderboards(stylePresets),
    [stylePresets]
  );

  // Non-fusion styles ranked by combination usage count
  const combinedStylesRanked = useMemo(
    () =>
      stylePresets
        .filter((p) => (p.combineCount || 0) > 0)
        .sort((a, b) => (b.combineCount || 0) - (a.combineCount || 0)),
    [stylePresets]
  );

  const maxArtistCount = topArtists.length > 0 ? topArtists[0].count : 1;
  const maxStyleCombineCount =
    combinedStylesRanked.length > 0 ? combinedStylesRanked[0].combineCount || 1 : 1;
  const maxPairCount = combinations.length > 0 ? combinations[0].count : 1;
  const totalBlendsCount = combinations.reduce((acc, c) => acc + c.count, 0);

  const handleLaunchPair = (combo: StylePairCombination) => {
    if (!onOpenCombiner) return;
    const styleA = stylePresets.find((p) => p.id === combo.styleAId);
    const styleB = stylePresets.find((p) => p.id === combo.styleBId);
    onOpenCombiner(styleA, styleB);
  };

  return (
    <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-4 flex flex-col">
      {/* Header Row: Title + Scope Toggle (Styles | Fusions) + Close */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">
            {boardScope === 'styles' ? 'Styles Leaderboard' : 'Fusions Leaderboard'}
          </h2>
          <p className="text-xs text-zinc-500 tabular-nums mt-0.5">
            {boardScope === 'styles'
              ? `${stylePresets.length} styles · ${topArtists.length} artists`
              : `${fusionPresets.length} fusions · ${totalBlendsCount} blends`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
            <button
              type="button"
              id="leaderboard-scope-styles"
              onClick={() => setBoardScope('styles')}
              className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                boardScope === 'styles'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Styles
            </button>
            <button
              type="button"
              id="leaderboard-scope-fusions"
              onClick={() => setBoardScope('fusions')}
              className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                boardScope === 'fusions'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Fusions
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              id="close-leaderboard-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
              aria-label="Close leaderboard"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Artist Filter Bar */}
      {selectedArtist && boardScope === 'styles' && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2 text-xs">
          <span className="text-zinc-300 truncate">
            Artist filter:{' '}
            <strong className="text-white font-medium">{selectedArtist}</strong>
          </span>
          <button
            type="button"
            onClick={() => onSelectArtist(null)}
            className="text-zinc-400 hover:text-white font-medium shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      {/* STYLES LEADERBOARD */}
      {boardScope === 'styles' && (
        <div className="mt-3 space-y-2.5">
          {/* 2 Clean Sub-Tabs: Artists | Most Combined (Tags tab removed) */}
          <div className="grid grid-cols-2 p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
            <button
              type="button"
              id="leaderboard-tab-artists"
              onClick={() => setStylesTab('artists')}
              className={`py-1.5 px-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                stylesTab === 'artists'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Artists
            </button>
            <button
              type="button"
              id="leaderboard-tab-combined"
              onClick={() => setStylesTab('combined')}
              className={`py-1.5 px-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                stylesTab === 'combined'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Most Combined
            </button>
          </div>

          {/* Optional Reset All Counts Action */}
          {stylesTab === 'combined' &&
            combinedStylesRanked.length > 0 &&
            onResetAllCombineCounts && (
              <div className="flex items-center justify-between text-xs px-0.5">
                <span className="text-zinc-500 tabular-nums">
                  {combinedStylesRanked.length} styles used in pairs
                </span>
                {confirmResetCounts ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onResetAllCombineCounts();
                        setConfirmResetCounts(false);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-medium"
                    >
                      Confirm Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResetCounts(false)}
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    id="reset-all-combine-counts-btn"
                    onClick={() => setConfirmResetCounts(true)}
                    className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            )}

          {/* Styles List Container */}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
            {stylesTab === 'artists' &&
              (topArtists.length === 0 ? (
                <div className="py-10 text-center text-xs text-zinc-500">
                  No artists found in style presets.
                </div>
              ) : (
                topArtists.map((artist, idx) => {
                  const isSelected = selectedArtist === artist.name;
                  const widthPct = Math.round((artist.count / maxArtistCount) * 100);

                  return (
                    <button
                      type="button"
                      key={artist.name}
                      id={`artist-rank-${idx}`}
                      onClick={() => onSelectArtist(isSelected ? null : artist.name)}
                      className={`w-full relative overflow-hidden rounded-lg border px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-zinc-900 border-indigo-500/60 text-white'
                          : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700 text-zinc-200'
                      }`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-500/10 pointer-events-none"
                        style={{ width: `${widthPct}%` }}
                      />
                      <div className="relative flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`text-[11px] font-mono tabular-nums w-5 shrink-0 ${
                              idx === 0 ? 'text-indigo-400 font-semibold' : 'text-zinc-500'
                            }`}
                          >
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <span className="text-xs font-medium truncate">
                            {artist.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                          <span className="text-xs font-mono tabular-nums text-zinc-400">
                            {artist.count}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              ))}

            {stylesTab === 'combined' &&
              (combinedStylesRanked.length === 0 ? (
                <div className="py-10 text-center text-xs text-zinc-500">
                  No styles combined yet.
                </div>
              ) : (
                combinedStylesRanked.map((preset, idx) => {
                  const count = preset.combineCount || 0;
                  const widthPct = Math.round((count / maxStyleCombineCount) * 100);

                  return (
                    <div
                      key={preset.id}
                      id={`style-combine-rank-${idx}`}
                      className="group relative overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950 hover:border-zinc-700 px-2.5 py-2 transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-indigo-500/10 pointer-events-none"
                        style={{ width: `${widthPct}%` }}
                      />
                      <div className="relative flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={`text-[11px] font-mono tabular-nums w-5 shrink-0 ${
                              idx === 0 ? 'text-indigo-400 font-semibold' : 'text-zinc-500'
                            }`}
                          >
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <div className="w-6 h-6 rounded overflow-hidden shrink-0 border border-zinc-800 bg-zinc-900">
                            <ImageWithFallback
                              src={preset.image_url}
                              alt={preset.name}
                              name={preset.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs font-medium text-zinc-200 truncate">
                            {preset.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-mono tabular-nums text-zinc-400">
                            {count}
                          </span>

                          {onOpenCombiner && (
                            <button
                              type="button"
                              onClick={() => onOpenCombiner(preset)}
                              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Combine this style"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onResetStyleCombineCount && (
                            <button
                              type="button"
                              onClick={() => onResetStyleCombineCount(preset.id)}
                              className="p-1 rounded text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                              title="Reset count"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ))}
          </div>
        </div>
      )}

      {/* FUSIONS LEADERBOARD */}
      {boardScope === 'fusions' && (
        <div className="mt-3 space-y-2.5">
          {/* 2 Clean Sub-Tabs: Top Pairs | Saved Fusions */}
          <div className="grid grid-cols-2 p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
            <button
              type="button"
              id="combos-subtab-pairs"
              onClick={() => {
                setFusionsTab('pairs');
                setConfirmDeleteFusions(false);
              }}
              className={`py-1.5 px-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                fusionsTab === 'pairs'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Top Pairs
            </button>
            <button
              type="button"
              id="combos-subtab-fusions"
              onClick={() => {
                setFusionsTab('saved');
                setConfirmClearCombos(false);
              }}
              className={`py-1.5 px-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                fusionsTab === 'saved'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Saved Fusions
            </button>
          </div>

          {/* Subtab Utility Row */}
          {fusionsTab === 'pairs' && combinations.length > 0 && onClearAllCombinations && (
            <div className="flex items-center justify-between text-xs px-0.5">
              <span className="text-zinc-500 tabular-nums">
                {combinations.length} pair combinations
              </span>
              {confirmClearCombos ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllCombinations();
                      setConfirmClearCombos(false);
                    }}
                    className="text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Confirm Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearCombos(false)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="clear-all-mix-records-btn"
                  onClick={() => setConfirmClearCombos(true)}
                  className="inline-flex items-center gap-1 text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              )}
            </div>
          )}

          {fusionsTab === 'saved' && fusionPresets.length > 0 && onDeleteAllSavedFusions && (
            <div className="flex items-center justify-between text-xs px-0.5">
              <span className="text-zinc-500 tabular-nums">
                {fusionPresets.length} saved fusions
              </span>
              {confirmDeleteFusions ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAllSavedFusions();
                      setConfirmDeleteFusions(false);
                    }}
                    className="text-rose-400 hover:text-rose-300 font-medium"
                  >
                    Confirm Delete All
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteFusions(false)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  id="delete-all-fusions-btn"
                  onClick={() => setConfirmDeleteFusions(true)}
                  className="inline-flex items-center gap-1 text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete All</span>
                </button>
              )}
            </div>
          )}

          {/* Fusions List Container */}
          <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5">
            {fusionsTab === 'pairs' &&
              (combinations.length === 0 ? (
                <div className="py-10 text-center text-xs text-zinc-500">
                  No fusion pairs recorded yet.
                </div>
              ) : (
                combinations.map((combo, idx) => {
                  const widthPct = Math.round((combo.count / maxPairCount) * 100);
                  return (
                    <div
                      key={combo.pairKey}
                      id={`pair-synergy-rank-${idx}`}
                      className="relative overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950 hover:border-zinc-700 px-3 py-2 transition-colors"
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-purple-500/10 pointer-events-none"
                        style={{ width: `${widthPct}%` }}
                      />
                      <div className="relative flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={`text-[11px] font-mono tabular-nums w-5 shrink-0 ${
                              idx === 0 ? 'text-purple-400 font-semibold' : 'text-zinc-500'
                            }`}
                          >
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-white truncate">
                              {combo.styleAName} + {combo.styleBName}
                            </p>
                            <p className="text-[11px] text-zinc-500 tabular-nums mt-0.5">
                              {combo.count} blends · {combo.preferredBlendMode || 'smart'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {onOpenCombiner && (
                            <button
                              type="button"
                              id={`fuse-pair-btn-${idx}`}
                              onClick={() => handleLaunchPair(combo)}
                              className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Load pair in Combiner"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onDeleteCombination && (
                            <button
                              type="button"
                              id={`delete-pair-btn-${idx}`}
                              onClick={() => onDeleteCombination(combo.pairKey)}
                              className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                              title="Remove blend record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ))}

            {fusionsTab === 'saved' &&
              (fusionPresets.length === 0 ? (
                <div className="py-10 text-center text-xs text-zinc-500">
                  No saved fusions yet.
                </div>
              ) : (
                fusionPresets.map((preset, idx) => (
                  <div
                    key={preset.id}
                    className="rounded-lg border border-zinc-800/80 bg-zinc-950 hover:border-zinc-700 px-3 py-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="text-[11px] font-mono tabular-nums w-5 shrink-0 text-zinc-500">
                          {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">
                            {preset.name}
                          </p>
                          {preset.parentStyleNames && (
                            <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                              {preset.parentStyleNames[0]} + {preset.parentStyleNames[1]}
                            </p>
                          )}
                        </div>
                      </div>

                      {onDeletePreset && (
                        <button
                          type="button"
                          id={`delete-saved-fusion-${preset.id}`}
                          onClick={() => onDeletePreset(preset.id)}
                          className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors shrink-0"
                          title="Delete saved fusion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
