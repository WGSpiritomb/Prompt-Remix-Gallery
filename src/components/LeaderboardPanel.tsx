import { useState } from 'react';
import {
  Trophy,
  Users,
  Tag,
  Sparkles,
  Layers,
  Flame,
  CheckCircle2,
  X,
  Filter,
  ArrowRight,
  GitMerge,
  Zap,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { StylePreset, ExtractedTag, StylePairCombination } from '../types';
import { computeLeaderboards } from '../utils/tagExtractor';
import { ImageWithFallback } from './ArtworkPlaceholder';

interface LeaderboardPanelProps {
  presets: StylePreset[];
  combinations?: StylePairCombination[];
  selectedArtist: string | null;
  selectedTag: string | null;
  onSelectArtist: (artist: string | null) => void;
  onSelectTag: (tag: string | null) => void;
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
  selectedArtist,
  selectedTag,
  onSelectArtist,
  onSelectTag,
  onOpenCombiner,
  onDeleteCombination,
  onClearAllCombinations,
  onDeletePreset,
  onDeleteAllSavedFusions,
  onResetStyleCombineCount,
  onResetAllCombineCounts,
  onClose,
}: LeaderboardPanelProps) {
  const [activeTab, setActiveTab] = useState<'artists' | 'tags' | 'combos'>('combos');
  const [tagCategoryFilter, setTagCategoryFilter] = useState<string>('all');
  const [comboSubTab, setComboSubTab] = useState<'pairs' | 'styles' | 'fusions'>('pairs');
  const [confirmClearCombos, setConfirmClearCombos] = useState(false);
  const [confirmDeleteFusions, setConfirmDeleteFusions] = useState(false);
  const [confirmResetCounts, setConfirmResetCounts] = useState(false);

  const { topArtists, topTags, totalTokensCount } = computeLeaderboards(presets);

  // Ranked presets by combineCount
  const combinedStylesRanked = [...presets]
    .filter((p) => (p.combineCount || 0) > 0)
    .sort((a, b) => (b.combineCount || 0) - (a.combineCount || 0));

  // Saved fusions
  const savedFusions = presets.filter((p) => p.isCombined);

  const maxArtistCount = topArtists.length > 0 ? topArtists[0].count : 1;
  const maxTagCount = topTags.length > 0 ? topTags[0].count : 1;
  const maxStyleCombineCount =
    combinedStylesRanked.length > 0 ? combinedStylesRanked[0].combineCount || 1 : 1;
  const maxPairCount = combinations.length > 0 ? combinations[0].count : 1;

  const filteredTags = topTags.filter((tag) => {
    if (tagCategoryFilter === 'all') return true;
    return tag.type === tagCategoryFilter;
  });

  const getRankBadge = (index: number) => {
    const formatted = (index + 1).toString().padStart(2, '0');
    if (index === 0) {
      return (
        <span className="w-5 h-5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-mono font-bold flex items-center justify-center shadow-sm">
          {formatted}
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-5 h-5 rounded bg-slate-700/60 text-slate-200 border border-slate-600 text-[10px] font-mono font-bold flex items-center justify-center">
          {formatted}
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono font-bold flex items-center justify-center">
          {formatted}
        </span>
      );
    }
    return (
      <span className="w-5 h-5 text-slate-500 text-[10px] font-mono flex items-center justify-center">
        {formatted}
      </span>
    );
  };

  const getTagCategoryColor = (type: ExtractedTag['type']) => {
    switch (type) {
      case 'engine':
        return 'bg-purple-950/60 text-purple-300 border-purple-800/40';
      case 'medium':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40';
      case 'lighting':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/40';
      case 'quality':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleLaunchPair = (combo: StylePairCombination) => {
    if (!onOpenCombiner) return;
    const styleA = presets.find((p) => p.id === combo.styleAId);
    const styleB = presets.find((p) => p.id === combo.styleBId);
    onOpenCombiner(styleA, styleB);
  };

  const handleLaunchSingleStyle = (preset: StylePreset) => {
    if (!onOpenCombiner) return;
    onOpenCombiner(preset);
  };

  const totalFusionsCount = combinations.reduce((acc, c) => acc + c.count, 0);

  return (
    <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200 flex items-center gap-2">
              Leaderboards & Synergies
              <span className="text-[9px] font-mono font-normal px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
                Live Stats
              </span>
            </h2>
            <p className="text-[10px] text-slate-500">
              Rankings for top combinations, artists & aesthetic tags
            </p>
          </div>
        </div>

        {onClose && (
          <button
            id="close-leaderboard-btn"
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Metric Quick Stats Cards */}
      <div className="grid grid-cols-4 gap-1.5 my-3">
        <div className="bg-[#0f1117] p-2 rounded-lg border border-slate-800 text-center">
          <p className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Styles</p>
          <p className="text-sm font-bold text-white mt-0.5 font-mono">{presets.length}</p>
        </div>
        <div className="bg-[#0f1117] p-2 rounded-lg border border-slate-800 text-center">
          <p className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Combos</p>
          <p className="text-sm font-bold text-indigo-400 mt-0.5 font-mono">{totalFusionsCount}</p>
        </div>
        <div className="bg-[#0f1117] p-2 rounded-lg border border-slate-800 text-center">
          <p className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Artists</p>
          <p className="text-sm font-bold text-purple-400 mt-0.5 font-mono">{topArtists.length}</p>
        </div>
        <div className="bg-[#0f1117] p-2 rounded-lg border border-slate-800 text-center">
          <p className="text-[8px] uppercase font-bold tracking-wider text-slate-500">Tags</p>
          <p className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">{topTags.length}</p>
        </div>
      </div>

      {/* Active Filter Reminder */}
      {(selectedArtist || selectedTag) && (
        <div className="mb-2.5 p-2 rounded-lg bg-indigo-900/30 border border-indigo-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-indigo-400 shrink-0" />
            <span className="text-slate-300 text-[11px]">
              Filtered by:{' '}
              <strong className="text-indigo-300 font-semibold font-mono">
                {selectedArtist || `#${selectedTag}`}
              </strong>
            </span>
          </div>
          <button
            onClick={() => {
              onSelectArtist(null);
              onSelectTag(null);
            }}
            className="text-[10px] text-indigo-400 hover:text-indigo-200 underline font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Tab Switcher: Combos vs Artists vs Tags */}
      <div className="flex items-center bg-[#0f1117] p-0.5 rounded-lg border border-slate-800 mb-2.5">
        <button
          id="leaderboard-tab-combos"
          onClick={() => setActiveTab('combos')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'combos'
              ? 'bg-indigo-900/50 text-indigo-200 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Combos</span>
        </button>

        <button
          id="leaderboard-tab-artists"
          onClick={() => setActiveTab('artists')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'artists'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span>Artists</span>
        </button>

        <button
          id="leaderboard-tab-tags"
          onClick={() => setActiveTab('tags')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'tags'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tags</span>
        </button>
      </div>

      {/* Sub-Filters for Combos tab */}
      {activeTab === 'combos' && (
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center gap-1 bg-[#0f1117] p-1 rounded-lg border border-slate-800/80 text-[10px]">
            <button
              id="combos-subtab-pairs"
              onClick={() => {
                setComboSubTab('pairs');
                setConfirmClearCombos(false);
                setConfirmDeleteFusions(false);
                setConfirmResetCounts(false);
              }}
              className={`flex-1 py-1 px-2 rounded font-semibold text-center transition-all ${
                comboSubTab === 'pairs'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top Synergies ({combinations.length})
            </button>
            <button
              id="combos-subtab-styles"
              onClick={() => {
                setComboSubTab('styles');
                setConfirmClearCombos(false);
                setConfirmDeleteFusions(false);
                setConfirmResetCounts(false);
              }}
              className={`flex-1 py-1 px-2 rounded font-semibold text-center transition-all ${
                comboSubTab === 'styles'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Most Combined ({combinedStylesRanked.length})
            </button>
            <button
              id="combos-subtab-fusions"
              onClick={() => {
                setComboSubTab('fusions');
                setConfirmClearCombos(false);
                setConfirmDeleteFusions(false);
                setConfirmResetCounts(false);
              }}
              className={`flex-1 py-1 px-2 rounded font-semibold text-center transition-all ${
                comboSubTab === 'fusions'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Saved ({savedFusions.length})
            </button>
          </div>

          {/* Quick Subtab Action Bar (Clear/Reset options) */}
          {comboSubTab === 'pairs' && combinations.length > 0 && onClearAllCombinations && (
            <div className="flex items-center justify-between px-1 text-[10px]">
              <span className="text-slate-500 font-mono">Recorded Pair Blends</span>
              {confirmClearCombos ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-rose-400 font-medium">Clear all mix history?</span>
                  <button
                    onClick={() => {
                      onClearAllCombinations();
                      setConfirmClearCombos(false);
                    }}
                    className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                  >
                    Yes, Clear
                  </button>
                  <button
                    onClick={() => setConfirmClearCombos(false)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id="clear-all-mix-records-btn"
                  onClick={() => setConfirmClearCombos(true)}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Clear all recorded synergy combinations"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Mix History</span>
                </button>
              )}
            </div>
          )}

          {comboSubTab === 'styles' && combinedStylesRanked.length > 0 && onResetAllCombineCounts && (
            <div className="flex items-center justify-between px-1 text-[10px]">
              <span className="text-slate-500 font-mono">Styles by Fusion Count</span>
              {confirmResetCounts ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-medium">Reset all combine counts?</span>
                  <button
                    onClick={() => {
                      onResetAllCombineCounts();
                      setConfirmResetCounts(false);
                    }}
                    className="px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setConfirmResetCounts(false)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id="reset-all-combine-counts-btn"
                  onClick={() => setConfirmResetCounts(true)}
                  className="flex items-center gap-1 text-slate-500 hover:text-amber-400 transition-colors"
                  title="Reset combine counters to zero"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Counts</span>
                </button>
              )}
            </div>
          )}

          {comboSubTab === 'fusions' && savedFusions.length > 0 && onDeleteAllSavedFusions && (
            <div className="flex items-center justify-between px-1 text-[10px]">
              <span className="text-slate-500 font-mono">Saved Combined Presets</span>
              {confirmDeleteFusions ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-rose-400 font-medium">Delete all {savedFusions.length} fusions?</span>
                  <button
                    onClick={() => {
                      onDeleteAllSavedFusions();
                      setConfirmDeleteFusions(false);
                    }}
                    className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                  >
                    Delete All
                  </button>
                  <button
                    onClick={() => setConfirmDeleteFusions(false)}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id="delete-all-fusions-btn"
                  onClick={() => setConfirmDeleteFusions(true)}
                  className="flex items-center gap-1 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Delete all saved fusion presets from library"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete All Fusions</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tags Sub-Category filter */}
      {activeTab === 'tags' && (
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-1.5 text-[10px] no-scrollbar">
          {['all', 'medium', 'engine', 'lighting', 'quality'].map((cat) => (
            <button
              key={cat}
              onClick={() => setTagCategoryFilter(cat)}
              className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition-all ${
                tagCategoryFilter === cat
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* List ranking container */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[380px]">
        {/* COMBOS TAB */}
        {activeTab === 'combos' && (
          <>
            {/* Top Pair Synergies */}
            {comboSubTab === 'pairs' && (
              combinations.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No combination pairs recorded yet. Combine styles to generate synergies!
                </div>
              ) : (
                combinations.map((combo, idx) => {
                  const percentage = Math.round((combo.count / maxPairCount) * 100);
                  return (
                    <div
                      key={combo.pairKey}
                      id={`pair-synergy-rank-${idx}`}
                      className="group relative p-2.5 rounded-lg border border-slate-800 bg-[#0f1117] hover:border-indigo-500/50 transition-all overflow-hidden"
                    >
                      {/* Background progress fill */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-indigo-500/10 transition-all duration-300 pointer-events-none"
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getRankBadge(idx)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                              <span className="text-indigo-300 truncate">{combo.styleAName}</span>
                              <span className="text-slate-500 text-[10px]">&amp;</span>
                              <span className="text-purple-300 truncate">{combo.styleBName}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-mono">
                              <span className="flex items-center gap-0.5 text-amber-400">
                                <Flame className="w-3 h-3" /> {combo.count} blends
                              </span>
                              <span>&bull;</span>
                              <span className="capitalize">{combo.preferredBlendMode || 'smart'} mode</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {onOpenCombiner && (
                            <button
                              id={`fuse-pair-btn-${idx}`}
                              onClick={() => handleLaunchPair(combo)}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-bold transition-colors"
                              title="Load this pair into Combiner"
                            >
                              <Zap className="w-2.5 h-2.5" />
                              <span>Fuse</span>
                            </button>
                          )}

                          {onDeleteCombination && (
                            <button
                              id={`delete-pair-btn-${idx}`}
                              onClick={() => onDeleteCombination(combo.pairKey)}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition-colors"
                              title="Delete this mix record"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* Most Combined Individual Styles */}
            {comboSubTab === 'styles' && (
              combinedStylesRanked.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No styles combined yet.
                </div>
              ) : (
                combinedStylesRanked.map((preset, idx) => {
                  const count = preset.combineCount || 0;
                  const percentage = Math.round((count / maxStyleCombineCount) * 100);

                  return (
                    <div
                      key={preset.id}
                      id={`style-combine-rank-${idx}`}
                      className="group relative p-2 rounded-lg border border-slate-800 bg-[#0f1117] hover:border-indigo-500/50 transition-all overflow-hidden"
                    >
                      {/* Background progress fill */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-indigo-500/10 transition-all duration-300 pointer-events-none"
                        style={{ width: `${percentage}%` }}
                      />

                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {getRankBadge(idx)}
                          <div className="w-6 h-6 rounded overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                            <ImageWithFallback
                              src={preset.image_url}
                              alt={preset.name}
                              name={preset.name}
                              artists={preset.derivedArtists}
                              tags={preset.derivedTags}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300">
                            {preset.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                            {count} fusions
                          </span>

                          {onOpenCombiner && (
                            <button
                              onClick={() => handleLaunchSingleStyle(preset)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                              title="Combine this style with another"
                            >
                              <Layers className="w-3 h-3 text-indigo-400" />
                            </button>
                          )}

                          {onResetStyleCombineCount && (
                            <button
                              onClick={() => onResetStyleCombineCount(preset.id)}
                              className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-amber-950/30 transition-colors"
                              title="Reset fusion counter for this style"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            )}

            {/* Saved Fusions */}
            {comboSubTab === 'fusions' && (
              savedFusions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No saved fusions yet. Use the Style Combiner to craft and save fused styles!
                </div>
              ) : (
                savedFusions.map((preset, idx) => (
                  <div
                    key={preset.id}
                    className="p-2.5 rounded-lg border border-slate-800 bg-[#0f1117] hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 shrink-0">
                            Fusion
                          </span>
                          <p className="text-xs font-bold text-white truncate">{preset.name}</p>
                        </div>
                        {preset.parentStyleNames && (
                          <p className="text-[10px] text-slate-400 truncate mt-1">
                            Parents: {preset.parentStyleNames[0]} + {preset.parentStyleNames[1]}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {onOpenCombiner && (
                          <button
                            onClick={() => handleLaunchSingleStyle(preset)}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Open in Combiner"
                          >
                            <Zap className="w-3 h-3 text-purple-400" />
                          </button>
                        )}
                        {onDeletePreset && (
                          <button
                            id={`delete-saved-fusion-${preset.id}`}
                            onClick={() => onDeletePreset(preset.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40 transition-colors"
                            title="Delete this saved fusion preset"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </>
        )}

        {/* ARTISTS TAB */}
        {activeTab === 'artists' &&
          (topArtists.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No artist signatures detected in prompts.
            </div>
          ) : (
            topArtists.map((artist, idx) => {
              const isSelected = selectedArtist === artist.name;
              const percentage = Math.round((artist.count / maxArtistCount) * 100);

              return (
                <div
                  key={artist.name}
                  id={`artist-rank-${idx}`}
                  onClick={() => onSelectArtist(isSelected ? null : artist.name)}
                  className={`group relative p-2 rounded-lg border cursor-pointer transition-all overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-900/40 border-indigo-500/50 shadow-sm'
                      : 'bg-[#0f1117] border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                  }`}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-indigo-500/10 transition-all duration-300 pointer-events-none"
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getRankBadge(idx)}
                      <span
                        className={`text-xs font-medium truncate ${
                          isSelected ? 'text-indigo-300' : 'text-slate-300 group-hover:text-indigo-400'
                        }`}
                      >
                        {artist.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {artist.count}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ))}

        {/* TAGS TAB */}
        {activeTab === 'tags' &&
          (filteredTags.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No matching tags found for this category.
            </div>
          ) : (
            filteredTags.map((tag, idx) => {
              const isSelected = selectedTag === tag.name;
              const percentage = Math.round((tag.count / maxTagCount) * 100);

              return (
                <div
                  key={tag.name}
                  id={`tag-rank-${idx}`}
                  onClick={() => onSelectTag(isSelected ? null : tag.name)}
                  className={`group relative p-2 rounded-lg border cursor-pointer transition-all overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-900/40 border-indigo-500/50 shadow-sm'
                      : 'bg-[#0f1117] border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
                  }`}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-indigo-500/10 transition-all duration-300 pointer-events-none"
                    style={{ width: `${percentage}%` }}
                  />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getRankBadge(idx)}
                      <span
                        className={`text-xs font-medium truncate ${
                          isSelected ? 'text-indigo-300' : 'text-slate-300 group-hover:text-indigo-400'
                        }`}
                      >
                        #{tag.name}
                      </span>
                      <span
                        className={`text-[9px] uppercase px-1 py-0.2 rounded border font-mono ${getTagCategoryColor(
                          tag.type
                        )}`}
                      >
                        {tag.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {tag.count}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3 h-3 text-indigo-400 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ))}
      </div>

      {/* Footer Info / Dataset stats */}
      <div className="pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span className="flex items-center gap-1 text-indigo-400">
          <Flame className="w-3 h-3" />
          styles.csv metrics
        </span>
        <span>{totalTokensCount} tokens &bull; {presets.length} presets</span>
      </div>
    </div>
  );
}
