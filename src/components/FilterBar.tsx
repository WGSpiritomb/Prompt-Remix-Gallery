import { useState } from 'react';
import { Search, X, Star, SlidersHorizontal, Image, Filter, ArrowUpDown, Zap, Trash2 } from 'lucide-react';
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
    <div className="bg-[#161b22] border border-slate-800 rounded-xl p-3 mb-5 backdrop-blur-md shadow-lg">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Real-time search bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="preset-search-input"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search styles, prompts, or artists..."
            className="w-full pl-10 pr-9 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors font-medium"
          />
          {search && (
            <button
              id="clear-search-btn"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Badges & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Favorites filter toggle */}
          <button
            id="filter-favorites-toggle"
            onClick={onToggleFavorites}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              onlyFavorites
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Has Image Preview filter toggle */}
          <button
            id="filter-has-image-toggle"
            onClick={onToggleHasImageOnly}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              hasImageOnly
                ? 'bg-indigo-900/40 border-indigo-500/40 text-indigo-300 shadow-sm'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Image className="w-3.5 h-3.5 text-indigo-400" />
            <span>Has Preview</span>
          </button>

          {/* Has Negative Prompt toggle */}
          <button
            id="filter-negative-prompt-toggle"
            onClick={onToggleHasNegativeOnly}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
              hasNegativeOnly
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 shadow-sm'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
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
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                combinedOnly
                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-300 shadow-sm'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Fusions Only</span>
            </button>
          )}

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              aria-label="Sort presets by"
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-2"
            >
              <option value="most_combined" className="bg-[#161b22] text-slate-200">Most Combined</option>
              <option value="name_asc" className="bg-[#161b22] text-slate-200">Name (A-Z)</option>
              <option value="name_desc" className="bg-[#161b22] text-slate-200">Name (Z-A)</option>
              <option value="newest" className="bg-[#161b22] text-slate-200">Recently Added</option>
              <option value="oldest" className="bg-[#161b22] text-slate-200">Oldest First</option>
              <option value="longest_prompt" className="bg-[#161b22] text-slate-200">Longest Prompt</option>
              <option value="shortest_prompt" className="bg-[#161b22] text-slate-200">Shortest Prompt</option>
              <option value="favorites_first" className="bg-[#161b22] text-slate-200">Favorites First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips & Counter */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 text-xs font-medium mr-1">
            Showing <strong className="text-slate-200 font-bold">{filteredCount}</strong> of{' '}
            <span className="text-slate-500">{totalCount} records</span>
          </span>

          {selectedArtist && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-medium">
              Artist: {selectedArtist}
              <button
                id="clear-artist-chip"
                onClick={onClearArtist}
                className="hover:text-indigo-100 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedTag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium">
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
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-500/30 text-[10px] font-medium">
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
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 text-rose-300 hover:text-rose-200 text-[10px] font-medium transition-colors"
                title="Delete all filtered fusion presets from library"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Filtered Fusions</span>
              </button>
            )
          )}

          {search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium">
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
              className="text-[11px] text-slate-400 hover:text-indigo-400 underline font-medium ml-1 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

