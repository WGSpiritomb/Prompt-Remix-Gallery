import { useState, useEffect, useMemo } from 'react';
import { Zap, Layers, Trash2, Sparkles } from 'lucide-react';
import {
  StylePreset,
  ViewMode,
  SortOption,
  ToastMessage,
  StylePairCombination,
  BlendMode,
  MainTab,
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
  haveCommonArtists,
  getSharedArtists,
  getCompatibleStylesFor,
  findRandomCompatiblePair,
  isBaseStyleIgnoredForMixing,
  filterMixablePresets,
  isTwoMixFusion,
  isAlreadyMixedFusion,
  isFusionPreset,
  isThreeArtistMix,
} from './utils/styleCombiner';

const STORAGE_KEY = 'prompt_styles_studio_presets_v1';
const VIEW_MODE_KEY = 'prompt_styles_view_mode';
const SORT_KEY = 'prompt_styles_sort';
const MAIN_TAB_KEY = 'prompt_styles_main_tab';

export default function App() {
  // --- Persistent State ---
  const [presets, setPresets] = useState<StylePreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StylePreset[];
        return parsed.map((p) => {
          // Rule: "3 artist mixes are not fusions. its only a fusion when you mix two 3 artist mixes."
          if (isThreeArtistMix(p)) {
            p.isCombined = false;
            p.isFusion = false;
          }
          return enrichPreset(p);
        });
      }
    } catch (e) {
      console.error('Failed to load presets from localStorage', e);
    }
    return getInitialPresets();
  });

  const [combinations, setCombinations] = useState<StylePairCombination[]>(() => {
    return loadCombinations(presets);
  });

  const [activeTab, setActiveTab] = useState<MainTab>(() => {
    const saved = localStorage.getItem(MAIN_TAB_KEY);
    return saved === 'fusions' ? 'fusions' : 'styles';
  });

  const [confirmPurgeFusions, setConfirmPurgeFusions] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return saved === 'table' ? 'table' : 'gallery';
  });

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem(SORT_KEY);
    return (saved as SortOption) || 'name_asc';
  });

  // Persist activeTab preference
  useEffect(() => {
    localStorage.setItem(MAIN_TAB_KEY, activeTab);
  }, [activeTab]);

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

  // Clean up any Base styles or already mixed fusions from fusion slots if loaded from stale storage
  useEffect(() => {
    if (fusionSlotA && (isBaseStyleIgnoredForMixing(fusionSlotA) || isAlreadyMixedFusion(fusionSlotA))) {
      setFusionSlotA(null);
    }
    if (fusionSlotB && (isBaseStyleIgnoredForMixing(fusionSlotB) || isAlreadyMixedFusion(fusionSlotB))) {
      setFusionSlotB(null);
    }
  }, [fusionSlotA, fusionSlotB]);

  // --- Fusion & Combiner Handlers ---
  const handleOpenCombiner = (styleA?: StylePreset | null, styleB?: StylePreset | null) => {
    // If the specifically requested style is a Base preset, prevent opening with it
    if (styleA && isBaseStyleIgnoredForMixing(styleA)) {
      showToast(
        'Base Style Ignored for Mixing',
        `"${styleA.name}" is a Base style and cannot be used for mixing.`,
        'warning'
      );
      return;
    }
    if (styleA && isAlreadyMixedFusion(styleA)) {
      showToast(
        'Mixed Fusion Excluded',
        `"${styleA.name}" is already a mixed fusion and cannot be used for mixing.`,
        'warning'
      );
      return;
    }
    if (styleB && isAlreadyMixedFusion(styleB)) {
      showToast(
        'Mixed Fusion Excluded',
        `"${styleB.name}" is already a mixed fusion and cannot be used for mixing.`,
        'warning'
      );
      return;
    }

    const mixablePresets = filterMixablePresets(presets);
    if (mixablePresets.length === 0) {
      showToast('No Mixable Styles', 'No valid unblended styles available to mix.', 'warning');
      return;
    }

    let initialA =
      (styleA && !isBaseStyleIgnoredForMixing(styleA) && !isAlreadyMixedFusion(styleA) ? styleA : null) ||
      (fusionSlotA && !isBaseStyleIgnoredForMixing(fusionSlotA) && !isAlreadyMixedFusion(fusionSlotA) ? fusionSlotA : null) ||
      mixablePresets[0] ||
      null;

    let initialB =
      styleB && !isBaseStyleIgnoredForMixing(styleB) && !isAlreadyMixedFusion(styleB)
        ? styleB
        : fusionSlotB && !isBaseStyleIgnoredForMixing(fusionSlotB) && !isAlreadyMixedFusion(fusionSlotB)
        ? fusionSlotB
        : null;

    if (initialA) {
      // Ensure initialB has no common artist with initialA and is not a base style or already mixed fusion
      if (
        !initialB ||
        initialB.id === initialA.id ||
        haveCommonArtists(initialA, initialB) ||
        isBaseStyleIgnoredForMixing(initialB) ||
        isAlreadyMixedFusion(initialB)
      ) {
        const compatibleList = getCompatibleStylesFor(initialA, mixablePresets);
        initialB = compatibleList[0] || mixablePresets.find((p) => p.id !== initialA?.id) || null;
      }
    }

    setCombinerStyleA(initialA);
    setCombinerStyleB(initialB);
    setIsCombinerOpen(true);
  };

  const handleToggleSelectForFusion = (preset: StylePreset) => {
    if (!preset) return;

    // Strict rule: ignore 01-Base and any style containing "Base" with numbers in the front
    if (isBaseStyleIgnoredForMixing(preset)) {
      showToast(
        'Base Style Ignored for Mixing',
        `"${preset.name}" is a Base template with leading numbers and is excluded from style mixing.`,
        'warning'
      );
      return;
    }

    // Strict rule: "dont use already mixed fusions for mixing"
    if (isAlreadyMixedFusion(preset)) {
      showToast(
        'Mixed Fusion Excluded',
        `"${preset.name}" is already a mixed fusion and cannot be used for mixing.`,
        'warning'
      );
      return;
    }

    if (fusionSlotA?.id === preset.id) {
      setFusionSlotA(null);
      showToast('Removed from Slot A', preset.name, 'info');
    } else if (fusionSlotB?.id === preset.id) {
      setFusionSlotB(null);
      showToast('Removed from Slot B', preset.name, 'info');
    } else if (!fusionSlotA) {
      // Check if slot B is already filled and shares artists
      if (fusionSlotB && haveCommonArtists(preset, fusionSlotB)) {
        const shared = getSharedArtists(preset, fusionSlotB);
        showToast(
          'Cannot Mix: Common Artist',
          `"${preset.name}" and "${fusionSlotB.name}" share artist (${shared.join(', ')}). Styles A and B cannot share artists.`,
          'error'
        );
        return;
      }
      setFusionSlotA(preset);
      showToast('Selected as Style A (Base)', preset.name, 'info');
    } else if (!fusionSlotB) {
      // Verify preset has no common artists with Slot A
      if (haveCommonArtists(fusionSlotA, preset)) {
        const shared = getSharedArtists(fusionSlotA, preset);
        showToast(
          'Cannot Mix: Common Artist',
          `"${preset.name}" and "${fusionSlotA.name}" share artist (${shared.join(', ')}). Styles A and B cannot share artists.`,
          'error'
        );
        return;
      }
      setFusionSlotB(preset);
      const partnerName = fusionSlotA?.name || 'Style A';
      showToast(
        'Selected as Style B (Accent)',
        `Ready to blend with "${partnerName}"!`,
        'success'
      );
    } else {
      // Both were filled; user is replacing Slot B
      if (haveCommonArtists(fusionSlotA, preset)) {
        const shared = getSharedArtists(fusionSlotA, preset);
        showToast(
          'Cannot Mix: Common Artist',
          `"${preset.name}" and "${fusionSlotA.name}" share artist (${shared.join(', ')}). Styles A and B cannot share artists.`,
          'error'
        );
        return;
      }
      setFusionSlotB(preset);
      showToast('Updated Style B (Accent)', preset.name, 'info');
    }
  };

  const handleRandomizeFusionPair = () => {
    const mixable = filterMixablePresets(presets);
    if (mixable.length < 2) {
      showToast('Not Enough Mixable Styles', 'Need at least 2 non-Base styles to mix.', 'warning');
      return;
    }
    const compatiblePair = findRandomCompatiblePair(mixable);
    if (compatiblePair) {
      const [a, b] = compatiblePair;
      setFusionSlotA(a);
      setFusionSlotB(b);
      showToast('Distinct Pair Selected', `${a.name} + ${b.name} (no shared artists)`, 'info');
    } else {
      showToast('No Compatible Pair', 'Could not find a compatible pair without shared artists.', 'error');
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
    const fusionPreset: StylePreset = {
      ...newPreset,
      isFusion: true,
      isCombined: true,
    };
    const enriched = enrichPreset(fusionPreset);
    setPresets((prev) => [enriched, ...prev]);
    // Clear fusion slots
    setFusionSlotA(null);
    setFusionSlotB(null);
    showToast('Fusion Preset Saved!', `Saved "${enriched.name}" to the Fusions tab!`, 'success');
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
    const fusions = presets.filter(isFusionPreset);
    setPresets((prev) => prev.filter((p) => !isFusionPreset(p)));
    showToast('Fusions Deleted', `Removed ${fusions.length} fusion presets`, 'info');
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
      filteredAndSortedPresets.filter(isFusionPreset).map((p) => p.id)
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
    const exportable = presets.filter((p) => !isFusionPreset(p));
    const excludedCount = presets.length - exportable.length;
    const csvContent = exportToStrictCSV(presets);
    downloadCSV(csvContent, 'styles.csv');
    showToast(
      'styles.csv Exported',
      `Strict headers (name,prompt,negative_prompt) for ${exportable.length} styles sorted A-Z${
        excludedCount > 0 ? ` (${excludedCount} fusion${excludedCount > 1 ? 's' : ''} excluded)` : ''
      }`,
      'success'
    );
  };

  const handleExportExtendedCSV = () => {
    const exportable = presets.filter((p) => !isFusionPreset(p));
    const excludedCount = presets.length - exportable.length;
    const csvContent = exportToExtendedCSV(presets);
    downloadCSV(csvContent, 'styles_with_images.csv');
    showToast(
      'Extended CSV Exported',
      `Includes image_url column, sorted Name A-Z for ${exportable.length} styles${
        excludedCount > 0 ? ` (${excludedCount} fusion${excludedCount > 1 ? 's' : ''} excluded)` : ''
      }`,
      'success'
    );
  };

  const handleBulkExport = (selectedPresets: StylePreset[]) => {
    const exportable = selectedPresets.filter((p) => !isFusionPreset(p));
    const excludedCount = selectedPresets.length - exportable.length;
    if (exportable.length === 0) {
      showToast(
        'Fusions Excluded from CSV',
        'Fusions cannot be exported to .csv files per system rules.',
        'warning'
      );
      return;
    }
    const csvContent = exportToStrictCSV(selectedPresets);
    downloadCSV(csvContent, 'selected_styles.csv');
    showToast(
      'Selected Styles Exported',
      `Exported ${exportable.length} styles sorted Name A-Z${
        excludedCount > 0 ? ` (${excludedCount} fusion${excludedCount > 1 ? 's' : ''} excluded)` : ''
      }`,
      'success'
    );
  };

  const handleCopyCSVToClipboard = async () => {
    const exportable = presets.filter((p) => !isFusionPreset(p));
    const excludedCount = presets.length - exportable.length;
    const csvContent = exportToStrictCSV(presets);
    await handleCopyText(
      csvContent,
      `${exportable.length} styles in styles.csv format (A-Z)${
        excludedCount > 0 ? ` (${excludedCount} fusion${excludedCount > 1 ? 's' : ''} excluded)` : ''
      }`
    );
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

    // Filter by Active Tab: 'styles' vs 'fusions'
    if (activeTab === 'styles') {
      result = result.filter((item) => !isFusionPreset(item));
    } else {
      result = result.filter((item) => isFusionPreset(item));
    }

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
    activeTab,
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
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
        {/* Fusions Tab Dedicated Header Banner */}
        {activeTab === 'fusions' && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-950 to-indigo-950/30 border border-purple-500/20 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Zap className="w-4 h-4 fill-purple-400 text-purple-400" />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight">Style Fusions</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  {presets.filter(isFusionPreset).length} Fusions
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Excluded from styles.csv export
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Fusions are created by mixing two 3-artist styles. Fusions are stored on this separate tab and cannot be used as parents for further mixing.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="fusions-tab-mix-new-btn"
                onClick={() => handleOpenCombiner()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-950/50 transition-all hover:scale-[1.02]"
                title="Open 2-Style Fusion Combiner"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mix New Fusion</span>
              </button>

              {presets.filter(isFusionPreset).length > 0 && (
                confirmPurgeFusions ? (
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-rose-950/80 border border-rose-800">
                    <span className="text-[11px] text-rose-300 px-1 font-medium">Delete all fusions?</span>
                    <button
                      onClick={() => {
                        handleDeleteAllSavedFusions();
                        setConfirmPurgeFusions(false);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-500 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmPurgeFusions(false)}
                      className="px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 text-[11px] hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    id="fusions-tab-clear-all-btn"
                    onClick={() => setConfirmPurgeFusions(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 transition-colors"
                    title="Delete all blended fusions"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear Fusions</span>
                  </button>
                )
              )}
            </div>
          </div>
        )}

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
          combinedOnly={activeTab === 'styles' ? combinedOnly : false}
          onToggleCombinedOnly={activeTab === 'styles' ? () => setCombinedOnly(!combinedOnly) : undefined}
          selectedArtist={selectedArtist}
          onClearArtist={() => setSelectedArtist(null)}
          selectedTag={selectedTag}
          onClearTag={() => setSelectedTag(null)}
          totalCount={activeTab === 'styles' ? presets.filter((p) => !isFusionPreset(p)).length : presets.filter(isFusionPreset).length}
          filteredCount={filteredAndSortedPresets.length}
          onResetFilters={handleResetFilters}
          onDeleteFilteredCombined={handleDeleteFilteredCombined}
          onOpenStyleCreator={activeTab === 'styles' ? () => setIsStyleCreatorOpen(true) : undefined}
        />

        {/* Layout Grid: Main Content + Optional Side Leaderboard */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Presets View Container */}
          <div className="flex-1 w-full min-w-0">
            {filteredAndSortedPresets.length === 0 && activeTab === 'fusions' && !search && !selectedArtist && !selectedTag && !onlyFavorites ? (
              <div className="text-center py-16 px-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center mb-3 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                  <Zap className="w-7 h-7 fill-purple-400/20 text-purple-400" />
                </div>
                <h3 className="text-base font-bold text-white">No Style Fusions Yet</h3>
                <p className="text-xs text-zinc-400 max-w-md mt-1 mb-5">
                  Fusions are created only when you mix two 3-artist styles together. Fusions appear here on this separate tab and are strictly excluded from .csv exports.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setActiveTab('styles')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors border border-zinc-700"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Browse Styles Library</span>
                  </button>
                  <button
                    onClick={() => handleOpenCombiner()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-md shadow-purple-950/50"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Open 2-Style Combiner</span>
                  </button>
                </div>
              </div>
            ) : viewMode === 'gallery' ? (
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

      {/* Persistent Fusion Dock (Bottom Quick Combiner Bar - Only on Styles tab) */}
      {activeTab === 'styles' && (
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
      )}

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
          const mixable = filterMixablePresets(presets);
          if (a && b && !isBaseStyleIgnoredForMixing(a) && !isAlreadyMixedFusion(a) && !isBaseStyleIgnoredForMixing(b) && !isAlreadyMixedFusion(b)) {
            setFusionSlotA(a);
            setFusionSlotB(b);
            handleOpenCombiner(a, b);
          } else if (mixable.length >= 2) {
            handleOpenCombiner(mixable[0], mixable[1]);
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
