import { useState, useEffect, useMemo } from 'react';
import {
  StylePreset,
  ViewMode,
  SortOption,
  ToastMessage,
  StylePairCombination,
  BlendMode,
} from './types';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { GalleryView } from './components/GalleryView';
import { TableView } from './components/TableView';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { StyleModal } from './components/StyleModal';
import { ImportModal } from './components/ImportModal';
import { LightboxModal } from './components/LightboxModal';
import { StyleCombinerModal } from './components/StyleCombinerModal';
import { StyleCreatorModal } from './components/StyleCreatorModal';
import { HowToCombineModal } from './components/HowToCombineModal';
import { FusionDock } from './components/FusionDock';
import { ToastContainer } from './components/Toast';
import { getInitialPresets } from './data/sampleStyles';
import { exportToStrictCSV, exportToExtendedCSV, downloadCSV } from './utils/csv';
import { enrichPreset } from './utils/tagExtractor';
import {
  loadCombinations,
  recordCombinationEvent,
  deleteCombinationPair,
  clearAllCombinations,
  resetStyleCombineCount,
  resetAllCombineCounts,
} from './utils/styleCombiner';

const STORAGE_KEY = 'prompt_styles_studio_presets_v1';
const VIEW_MODE_KEY = 'prompt_styles_view_mode';
const SORT_KEY = 'prompt_styles_sort';

export default function App() {
  // --- Persistent State ---
  const [presets, setPresets] = useState<StylePreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StylePreset[];
        return parsed.map(enrichPreset);
      }
    } catch (e) {
      console.error('Failed to load presets from localStorage', e);
    }
    return getInitialPresets();
  });

  const [combinations, setCombinations] = useState<StylePairCombination[]>(() => {
    return loadCombinations(presets);
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return saved === 'table' ? 'table' : 'gallery';
  });

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem(SORT_KEY);
    return (saved as SortOption) || 'name_asc';
  });

  // --- Filtering State ---
  const [search, setSearch] = useState('');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [hasImageOnly, setHasImageOnly] = useState(false);
  const [hasNegativeOnly, setHasNegativeOnly] = useState(false);
  const [combinedOnly, setCombinedOnly] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  // --- Quick Fusion Dock Selection Slots ---
  const [fusionSlotA, setFusionSlotA] = useState<StylePreset | null>(null);
  const [fusionSlotB, setFusionSlotB] = useState<StylePreset | null>(null);

  // --- Modals State ---
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<StylePreset | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxPreset, setLightboxPreset] = useState<StylePreset | null>(null);

  // Combiner Studio Modal State
  const [isCombinerOpen, setIsCombinerOpen] = useState(false);
  const [combinerStyleA, setCombinerStyleA] = useState<StylePreset | null>(null);
  const [combinerStyleB, setCombinerStyleB] = useState<StylePreset | null>(null);

  // 3-Artist Style Creator Modal State
  const [isStyleCreatorOpen, setIsStyleCreatorOpen] = useState(false);

  // How to Combine Guide Modal
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // --- Toasts ---
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist presets to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
    } catch (e) {
      console.error('Failed to persist presets', e);
    }
  }, [presets]);

  // Persist view preference
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  // Persist sort preference
  useEffect(() => {
    localStorage.setItem(SORT_KEY, sortBy);
  }, [sortBy]);

  // Keyboard shortcuts (C for combiner, S/M for style creator, ? for guide)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleOpenCombiner();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsStyleCreatorOpen(true);
      } else if (e.key === '?') {
        e.preventDefault();
        setIsGuideOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fusionSlotA, fusionSlotB, presets]);

  // Add a toast helper
  const showToast = (
    title: string,
    message?: string,
    type: ToastMessage['type'] = 'success'
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, title, message, type, duration: 2500 };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to Clipboard!', label, 'success');
    } catch (err) {
      console.error('Failed to copy', err);
      showToast('Copy Failed', 'Please grant clipboard permissions', 'error');
    }
  };

  // --- Fusion & Combiner Handlers ---
  const handleOpenCombiner = (styleA?: StylePreset | null, styleB?: StylePreset | null) => {
    const initialA = styleA || fusionSlotA || presets[0] || null;
    const initialB =
      styleB ||
      fusionSlotB ||
      (presets.length > 1 && presets[1]?.id !== initialA?.id ? presets[1] : presets[0]) ||
      null;

    setCombinerStyleA(initialA);
    setCombinerStyleB(initialB);
    setIsCombinerOpen(true);
  };

  const handleToggleSelectForFusion = (preset: StylePreset) => {
    if (!preset) return;
    if (fusionSlotA?.id === preset.id) {
      setFusionSlotA(null);
      showToast('Removed from Slot A', preset.name, 'info');
    } else if (fusionSlotB?.id === preset.id) {
      setFusionSlotB(null);
      showToast('Removed from Slot B', preset.name, 'info');
    } else if (!fusionSlotA) {
      setFusionSlotA(preset);
      showToast('Selected as Style A (Base)', preset.name, 'info');
    } else if (!fusionSlotB) {
      setFusionSlotB(preset);
      const partnerName = fusionSlotA?.name || 'Style A';
      showToast(
        'Selected as Style B (Accent)',
        `Ready to blend with "${partnerName}"!`,
        'success'
      );
    } else {
      setFusionSlotB(preset);
      showToast('Updated Style B (Accent)', preset.name, 'info');
    }
  };

  const handleRandomizeFusionPair = () => {
    if (presets.length < 2) return;
    const idxA = Math.floor(Math.random() * presets.length);
    let idxB = Math.floor(Math.random() * (presets.length - 1));
    if (idxB >= idxA) idxB++;
    const a = presets[idxA];
    const b = presets[idxB];
    if (a && b) {
      setFusionSlotA(a);
      setFusionSlotB(b);
      showToast('Random Pair Selected', `${a.name} + ${b.name}`, 'info');
    }
  };

  const handleRecordCombination = (styleA: StylePreset, styleB: StylePreset, mode: BlendMode) => {
    if (!styleA || !styleB) return;
    // Increment combineCount on both presets
    setPresets((prev) =>
      prev.map((p) => {
        if (p.id === styleA.id || p.id === styleB.id) {
          return {
            ...p,
            combineCount: (p.combineCount || 0) + 1,
          };
        }
        return p;
      })
    );

    // Record pair combination event
    const nextCombos = recordCombinationEvent(styleA, styleB, mode, combinations);
    setCombinations(nextCombos);
  };

  const handleSaveCombinedPreset = (newPreset: StylePreset) => {
    const enriched = enrichPreset(newPreset);
    setPresets((prev) => [enriched, ...prev]);
    showToast('Fusion Preset Saved!', `Added "${enriched.name}" to styles library`, 'success');
  };

  const handleDeleteCombinationPair = (pairKey: string) => {
    const updated = deleteCombinationPair(pairKey, combinations);
    setCombinations(updated);
    showToast('Synergy Record Removed', 'Deleted combination mix record', 'info');
  };

  const handleClearAllCombinations = () => {
    const cleared = clearAllCombinations();
    setCombinations(cleared);
    showToast('Mix History Cleared', 'All synergy records removed', 'info');
  };

  const handleDeleteAllSavedFusions = () => {
    const count = presets.filter((p) => p.isCombined).length;
    setPresets((prev) => prev.filter((p) => !p.isCombined));
    showToast('Fusions Deleted', `Removed ${count} combined presets from library`, 'info');
  };

  const handleResetStyleCombineCount = (presetId: string) => {
    const target = presets.find((p) => p.id === presetId);
    setPresets((prev) => resetStyleCombineCount(presetId, prev));
    showToast('Count Reset', `Reset count for "${target?.name || 'style'}"`, 'info');
  };

  const handleResetAllCombineCounts = () => {
    setPresets((prev) => resetAllCombineCounts(prev));
    showToast('Counters Reset', 'Reset all style fusion counts to zero', 'info');
  };

  const handleDeleteFilteredCombined = () => {
    const toDeleteIds = new Set(
      filteredAndSortedPresets.filter((p) => p.isCombined).map((p) => p.id)
    );
    setPresets((prev) => prev.filter((p) => !toDeleteIds.has(p.id)));
    showToast('Filtered Fusions Deleted', `Removed ${toDeleteIds.size} fusion presets`, 'info');
  };

  // --- CRUD Handlers ---
  const handleSavePreset = (
    presetData: Omit<StylePreset, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (presetData.id) {
      // Edit existing
      setPresets((prev) =>
        prev.map((item) => {
          if (item.id === presetData.id) {
            return enrichPreset({
              ...item,
              ...presetData,
              updatedAt: Date.now(),
            });
          }
          return item;
        })
      );
      showToast('Preset Updated', `Saved changes to "${presetData.name}"`, 'success');
    } else {
      // Create new
      const newPreset: StylePreset = enrichPreset({
        ...presetData,
        id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: Date.now(),
      });
      setPresets((prev) => [newPreset, ...prev]);
      showToast('Preset Created', `Added "${presetData.name}" to styles`, 'success');
    }
  };

  const handleDeletePreset = (id: string) => {
    const target = presets.find((p) => p.id === id);
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (fusionSlotA?.id === id) setFusionSlotA(null);
    if (fusionSlotB?.id === id) setFusionSlotB(null);
    showToast(
      target?.isCombined ? 'Mix Deleted' : 'Preset Deleted',
      target ? `Removed "${target.name}"` : 'Preset removed',
      'info'
    );
  };

  const handleBulkDelete = (ids: string[]) => {
    const idSet = new Set(ids);
    setPresets((prev) => prev.filter((p) => !idSet.has(p.id)));
    showToast('Bulk Delete Completed', `Removed ${ids.length} presets`, 'info');
  };

  const handleDuplicatePreset = (preset: StylePreset) => {
    const duplicated: StylePreset = enrichPreset({
      ...preset,
      id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${preset.name} (Copy)`,
      createdAt: Date.now(),
    });
    setPresets((prev) => [duplicated, ...prev]);
    showToast('Preset Duplicated', `Created "${duplicated.name}"`, 'success');
  };

  const handleToggleFavorite = (id: string) => {
    setPresets((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextFav = !item.favorite;
          showToast(
            nextFav ? 'Added to Favorites' : 'Removed from Favorites',
            item.name,
            'info'
          );
          return { ...item, favorite: nextFav };
        }
        return item;
      })
    );
  };

  // --- Import / Export Handlers ---
  const handleImport = (newPresets: StylePreset[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setPresets(newPresets);
      showToast('Import Complete', `Replaced library with ${newPresets.length} presets`, 'success');
    } else {
      setPresets((prev) => [...newPresets, ...prev]);
      showToast('Import Complete', `Appended ${newPresets.length} presets to library`, 'success');
    }
  };

  const handleExportCleanCSV = () => {
    const csvContent = exportToStrictCSV(presets);
    downloadCSV(csvContent, 'styles.csv');
    showToast(
      'styles.csv Exported',
      `Strict headers (name,prompt,negative_prompt) for ${presets.length} presets`,
      'success'
    );
  };

  const handleExportExtendedCSV = () => {
    const csvContent = exportToExtendedCSV(presets);
    downloadCSV(csvContent, 'styles_with_images.csv');
    showToast('Extended CSV Exported', 'Includes image_url column', 'success');
  };

  const handleBulkExport = (selectedPresets: StylePreset[]) => {
    const csvContent = exportToStrictCSV(selectedPresets);
    downloadCSV(csvContent, 'selected_styles.csv');
    showToast(
      'Selected Presets Exported',
      `Exported ${selectedPresets.length} presets to CSV`,
      'success'
    );
  };

  const handleCopyCSVToClipboard = async () => {
    const csvContent = exportToStrictCSV(presets);
    await handleCopyText(csvContent, `${presets.length} presets in styles.csv format`);
  };

  // --- Modal Openers ---
  const handleOpenAddModal = () => {
    setEditingPreset(null);
    setIsStyleModalOpen(true);
  };

  const handleOpenEditModal = (preset: StylePreset) => {
    setEditingPreset(preset);
    setIsStyleModalOpen(true);
  };

  const handleOpenLightbox = (preset: StylePreset) => {
    setLightboxPreset(preset);
    setIsLightboxOpen(true);
  };

  // --- Filtering & Sorting Compute ---
  const filteredAndSortedPresets = useMemo(() => {
    let result = [...presets];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const promptMatch = item.prompt.toLowerCase().includes(q);
        const negMatch = item.negative_prompt.toLowerCase().includes(q);
        const artistMatch = item.derivedArtists?.some((a) => a.toLowerCase().includes(q));
        const tagMatch = item.derivedTags?.some((t) => t.toLowerCase().includes(q));
        return nameMatch || promptMatch || negMatch || artistMatch || tagMatch;
      });
    }

    // Artist Filter
    if (selectedArtist) {
      const targetArtistLower = selectedArtist.toLowerCase();
      result = result.filter((item) =>
        item.derivedArtists?.some((a) => a.toLowerCase() === targetArtistLower) ||
        item.prompt.toLowerCase().includes(targetArtistLower) ||
        item.name.toLowerCase().includes(targetArtistLower)
      );
    }

    // Tag Filter
    if (selectedTag) {
      const targetTagLower = selectedTag.toLowerCase();
      result = result.filter((item) =>
        item.derivedTags?.some((t) => t.toLowerCase() === targetTagLower) ||
        item.prompt.toLowerCase().includes(targetTagLower)
      );
    }

    // Filter toggles
    if (onlyFavorites) {
      result = result.filter((item) => Boolean(item.favorite));
    }

    if (hasImageOnly) {
      result = result.filter((item) => Boolean(item.image_url));
    }

    if (hasNegativeOnly) {
      result = result.filter((item) => Boolean(item.negative_prompt && item.negative_prompt.trim()));
    }

    if (combinedOnly) {
      result = result.filter((item) => Boolean(item.isCombined));
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'name_desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === 'newest') {
        return b.createdAt - a.createdAt;
      }
      if (sortBy === 'oldest') {
        return a.createdAt - b.createdAt;
      }
      if (sortBy === 'most_combined') {
        return (b.combineCount || 0) - (a.combineCount || 0);
      }
      if (sortBy === 'longest_prompt') {
        return b.prompt.length - a.prompt.length;
      }
      if (sortBy === 'shortest_prompt') {
        return a.prompt.length - b.prompt.length;
      }
      if (sortBy === 'favorites_first') {
        if (a.favorite === b.favorite) return a.name.localeCompare(b.name);
        return a.favorite ? -1 : 1;
      }
      return 0;
    });

    return result;
  }, [
    presets,
    search,
    selectedArtist,
    selectedTag,
    onlyFavorites,
    hasImageOnly,
    hasNegativeOnly,
    combinedOnly,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedArtist(null);
    setSelectedTag(null);
    setOnlyFavorites(false);
    setHasImageOnly(false);
    setHasNegativeOnly(false);
    setCombinedOnly(false);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-200 flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200 pb-20">
      {/* Toast notification overlay */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navigation */}
      <Navbar
        presets={presets}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showLeaderboard={showLeaderboard}
        onToggleLeaderboard={() => setShowLeaderboard(!showLeaderboard)}
        onOpenAddModal={handleOpenAddModal}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenCombinerModal={() => handleOpenCombiner()}
        onOpenStyleCreatorModal={() => setIsStyleCreatorOpen(true)}
        onOpenGuideModal={() => setIsGuideOpen(true)}
        onExportCleanCSV={handleExportCleanCSV}
        onExportExtendedCSV={handleExportExtendedCSV}
        onCopyCSVToClipboard={handleCopyCSVToClipboard}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Search & Filter Bar */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onlyFavorites={onlyFavorites}
          onToggleFavorites={() => setOnlyFavorites(!onlyFavorites)}
          hasImageOnly={hasImageOnly}
          onToggleHasImageOnly={() => setHasImageOnly(!hasImageOnly)}
          hasNegativeOnly={hasNegativeOnly}
          onToggleHasNegativeOnly={() => setHasNegativeOnly(!hasNegativeOnly)}
          combinedOnly={combinedOnly}
          onToggleCombinedOnly={() => setCombinedOnly(!combinedOnly)}
          selectedArtist={selectedArtist}
          onClearArtist={() => setSelectedArtist(null)}
          selectedTag={selectedTag}
          onClearTag={() => setSelectedTag(null)}
          totalCount={presets.length}
          filteredCount={filteredAndSortedPresets.length}
          onResetFilters={handleResetFilters}
          onDeleteFilteredCombined={handleDeleteFilteredCombined}
          onOpenStyleCreator={() => setIsStyleCreatorOpen(true)}
        />

        {/* Layout Grid: Main Content + Optional Side Leaderboard */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Presets View Container */}
          <div className="flex-1 w-full min-w-0">
            {viewMode === 'gallery' ? (
              <GalleryView
                presets={filteredAndSortedPresets}
                selectedSlotAId={fusionSlotA?.id || null}
                selectedSlotBId={fusionSlotB?.id || null}
                onOpenLightbox={handleOpenLightbox}
                onEditPreset={handleOpenEditModal}
                onDeletePreset={handleDeletePreset}
                onDuplicatePreset={handleDuplicatePreset}
                onToggleFavorite={handleToggleFavorite}
                onSelectArtist={(artist) => setSelectedArtist(artist)}
                onSelectTag={(tag) => setSelectedTag(tag)}
                onOpenCombiner={(preset) => handleOpenCombiner(preset, null)}
                onToggleSelectForFusion={handleToggleSelectForFusion}
                onCopyText={handleCopyText}
              />
            ) : (
              <TableView
                presets={filteredAndSortedPresets}
                onOpenLightbox={handleOpenLightbox}
                onEditPreset={handleOpenEditModal}
                onDeletePreset={handleDeletePreset}
                onDuplicatePreset={handleDuplicatePreset}
                onToggleFavorite={handleToggleFavorite}
                onSelectArtist={(artist) => setSelectedArtist(artist)}
                onSelectTag={(tag) => setSelectedTag(tag)}
                onOpenCombiner={(preset) => handleOpenCombiner(preset, null)}
                onOpenCombinerWithPair={(a, b) => handleOpenCombiner(a, b)}
                onCopyText={handleCopyText}
                onBulkDelete={handleBulkDelete}
                onBulkExport={handleBulkExport}
              />
            )}
          </div>

          {/* Leaderboard Panel (Sidebar or collapsable) */}
          {showLeaderboard && (
            <aside className="w-full lg:w-80 lg:sticky lg:top-20 shrink-0 transition-all">
              <LeaderboardPanel
                presets={presets}
                combinations={combinations}
                selectedArtist={selectedArtist}
                selectedTag={selectedTag}
                onSelectArtist={(artist) => setSelectedArtist(artist)}
                onSelectTag={(tag) => setSelectedTag(tag)}
                onOpenCombiner={(a, b) => handleOpenCombiner(a, b)}
                onDeleteCombination={handleDeleteCombinationPair}
                onClearAllCombinations={handleClearAllCombinations}
                onDeletePreset={handleDeletePreset}
                onDeleteAllSavedFusions={handleDeleteAllSavedFusions}
                onResetStyleCombineCount={handleResetStyleCombineCount}
                onResetAllCombineCounts={handleResetAllCombineCounts}
                onClose={() => setShowLeaderboard(false)}
              />
            </aside>
          )}
        </div>
      </main>

      {/* Persistent Fusion Dock (Bottom Quick Combiner Bar) */}
      <FusionDock
        presets={presets}
        styleA={fusionSlotA}
        styleB={fusionSlotB}
        onClearStyleA={() => setFusionSlotA(null)}
        onClearStyleB={() => setFusionSlotB(null)}
        onClearAll={() => {
          setFusionSlotA(null);
          setFusionSlotB(null);
        }}
        onRandomizePair={handleRandomizeFusionPair}
        onOpenCombiner={handleOpenCombiner}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Modals */}
      <StyleModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        onSave={handleSavePreset}
        editingPreset={editingPreset}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
      />

      <LightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        preset={lightboxPreset}
        presetsList={filteredAndSortedPresets}
        onSelectPreset={setLightboxPreset}
        onEditPreset={handleOpenEditModal}
        onDeletePreset={handleDeletePreset}
        onToggleFavorite={handleToggleFavorite}
        onOpenCombiner={(preset) => handleOpenCombiner(preset, null)}
        onCopyText={handleCopyText}
      />

      {/* 2-Style Fusion Combiner Modal */}
      <StyleCombinerModal
        isOpen={isCombinerOpen}
        onClose={() => setIsCombinerOpen(false)}
        presets={presets}
        initialStyleA={combinerStyleA}
        initialStyleB={combinerStyleB}
        onSaveCombinedPreset={handleSaveCombinedPreset}
        onRecordCombination={handleRecordCombination}
        onOpenGuide={() => setIsGuideOpen(true)}
        onCopyText={handleCopyText}
      />

      {/* 3-Artist Style Creator Modal */}
      <StyleCreatorModal
        isOpen={isStyleCreatorOpen}
        onClose={() => setIsStyleCreatorOpen(false)}
        presets={presets}
        onSavePreset={handleSavePreset}
        onCopyText={handleCopyText}
      />

      {/* How to Combine Styles Guide Modal */}
      <HowToCombineModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        presets={presets}
        onSelectPairToCombine={(styleAId, styleBId) => {
          const a = presets.find((p) => p.id === styleAId);
          const b = presets.find((p) => p.id === styleBId);
          if (a && b) {
            setFusionSlotA(a);
            setFusionSlotB(b);
            handleOpenCombiner(a, b);
          } else if (presets.length >= 2) {
            handleOpenCombiner(presets[0], presets[1]);
          }
        }}
      />

      {/* Footer info bar */}
      <footer className="border-t border-slate-800 bg-[#0f1117] py-5 mt-10 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Prompt Styles Studio &bull; Strict RFC 4180 CSV Compliant (
            <span className="text-indigo-400">name,prompt,negative_prompt</span>)
          </p>
          <p className="text-slate-400">
            {presets.length} style blueprints &bull; {combinations.length} recorded combos &bull; Auto-saved locally
          </p>
        </div>
      </footer>
    </div>
  );
}
