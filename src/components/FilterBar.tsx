import { useState } from 'react';
import { Search, X, Star, SlidersHorizontal, Image, ArrowUpDown, Zap, Trash2, Dices, Sparkles } from 'lucide-react';
import { SortOption } from '../types';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onlyFavorites: boolean;
  onToggleFavorites: () => void;
  hasImageOnly: boolean;
  onToggleHasImageOnly: () => void;
  hasNegativeOnly: boolean;
  onToggleHasNegativeOnly: () => void;
  combinedOnly?: boolean;
  onToggleCombinedOnly?: () => void;
  selectedArtist: string | null;
  onClearArtist: () => void;
  selectedTag: string | null;
  onClearTag: () => void;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
  onDeleteFilteredCombined?: () => void;
  onOpenStyleCreator?: () => void;
}

export function FilterBar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  onlyFavorites,
  onToggleFavorites,
  hasImageOnly,
  onToggleHasImageOnly,
  hasNegativeOnly,
  onToggleHasNegativeOnly,
  combinedOnly = false,
  onToggleCombinedOnly,
  selectedArtist,
  onClearArtist,
  selectedTag,
  onClearTag,
  totalCount,
  filteredCount,
  onResetFilters,
  onDeleteFilteredCombined,
  onOpenStyleCreator,
}: FilterBarProps) {
  const [confirmPurge, setConfirmPurge] = useState(false);

  const hasActiveFilters =
    Boolean(search) ||
    onlyFavorites ||
    hasImageOnly ||
    hasNegativeOnly ||
    combinedOnly ||
    Boolean(selectedArtist) ||
    Boolean(selectedTag);

  return (
    <div className="liquid-glass rounded-2xl p-3 mb-5 border border-white/[0.08] shadow-xl">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Real-time search bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="preset-search-input"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search styles, prompts, or artists..."
            className="w-full pl-10 pr-9 py-2 liquid-glass-input rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 font-medium"
          />
          {search && (
            <button
              id="clear-search-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Badges, Style Creator shortcut & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick 3-Artist Mix button in FilterBar */}
          {onOpenStyleCreator && (
            <button
              id="filter-quick-creator-btn"
              onClick={onOpenStyleCreator}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 hover:from-indigo-500/35 hover:to-purple-500/35 text-white border border-indigo-400/30 transition-all hover:scale-[1.02] shadow-sm"
              title="Open Style Creator (3-Artist Mix)"
            >
              <Dices className="w-3.5 h-3.5 text-indigo-300" />
              <span>3-Artist Mix</span>
            </button>
          )}

          {/* Favorites filter toggle */}
          <button
            id="filter-favorites-toggle"
            onClick={onToggleFavorites}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              onlyFavorites
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                : 'liquid-glass-pill text-slate-300 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Has Image Preview filter toggle */}
          <button
            id="filter-has-image-toggle"
            onClick={onToggleHasImageOnly}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              hasImageOnly
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-sm'
                : 'liquid-glass-pill text-slate-300 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5 text-indigo-400" />
            <span>Has Preview</span>
          </button>

          {/* Has Negative Prompt toggle */}
          <button
            id="filter-negative-prompt-toggle"
            onClick={onToggleHasNegativeOnly}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              hasNegativeOnly
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm'
                : 'liquid-glass-pill text-slate-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
            <span>Has Negative</span>
          </button>

          {/* Combined Fusions Only toggle */}
          {onToggleCombinedOnly && (
            <button
              id="filter-fusions-toggle"
              onClick={onToggleCombinedOnly}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                combinedOnly
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-sm'
                  : 'liquid-glass-pill text-slate-300 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Fusions</span>
            </button>
          )}

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 liquid-glass-pill rounded-xl px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort presets by"
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer pr-2"
            >
              <option value="most_combined" className="bg-[#0b0f17] text-slate-200">Most Combined</option>
              <option value="name_asc" className="bg-[#0b0f17] text-slate-200">Name (A-Z)</option>
              <option value="name_desc" className="bg-[#0b0f17] text-slate-200">Name (Z-A)</option>
              <option value="newest" className="bg-[#0b0f17] text-slate-200">Recently Added</option>
              <option value="oldest" className="bg-[#0b0f17] text-slate-200">Oldest First</option>
              <option value="longest_prompt" className="bg-[#0b0f17] text-slate-200">Longest Prompt</option>
              <option value="shortest_prompt" className="bg-[#0b0f17] text-slate-200">Shortest Prompt</option>
              <option value="favorites_first" className="bg-[#0b0f17] text-slate-200">Favorites First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips & Counter */}
      <div className="mt-2.5 pt-2.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 text-xs font-medium mr-1">
            Showing <strong className="text-white font-bold">{filteredCount}</strong> of{' '}
            <span className="text-slate-400">{totalCount} styles</span>
          </span>

          {selectedArtist && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium">
              Artist: {selectedArtist}
              <button
                id="clear-artist-chip"
                onClick={onClearArtist}
                className="hover:text-white ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedTag && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.08] text-slate-200 border border-white/[0.1] text-[10px] font-medium">
              #{selectedTag}
              <button
                id="clear-tag-chip"
                onClick={onClearTag}
                className="hover:text-white ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {combinedOnly && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-medium">
              <span>Fusions Only ({filteredCount})</span>
              {onToggleCombinedOnly && (
                <button
                  onClick={onToggleCombinedOnly}
                  className="hover:text-white ml-0.5"
                  title="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          )}

          {combinedOnly && filteredCount > 0 && onDeleteFilteredCombined && (
            confirmPurge ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800/80 text-[10px]">
                <span className="text-rose-300 font-medium">Delete all {filteredCount} fusions?</span>
                <button
                  onClick={() => {
                    onDeleteFilteredCombined();
                    setConfirmPurge(false);
                  }}
                  className="px-1.5 py-0.2 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmPurge(false)}
                  className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                id="delete-filtered-fusions-btn"
                onClick={() => setConfirmPurge(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[10px] font-medium transition-colors"
                title="Delete all filtered fusion presets from library"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Filtered Fusions</span>
              </button>
            )
          )}

          {search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.08] text-slate-200 border border-white/[0.1] text-[10px] font-medium">
              &quot;{search}&quot;
              <button
                onClick={() => onSearchChange('')}
                className="hover:text-white ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {hasActiveFilters && (
            <button
              id="reset-all-filters-btn"
              onClick={onResetFilters}
              className="text-[11px] text-indigo-300 hover:text-indigo-200 underline font-medium ml-1 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


