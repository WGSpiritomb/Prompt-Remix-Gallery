import { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Lock,
  Unlock,
  Shuffle,
  ArrowLeftRight,
  Copy,
  Check,
  Save,
  Search,
  ChevronDown,
  Undo2,
  Dices,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { StylePreset, BlendMode } from '../types';
import {
  combinePositivePrompts,
  mergeNegativePrompts,
  createCombinedPreset,
  haveCommonArtists,
  getSharedArtists,
  getCompatibleStylesFor,
  findRandomCompatiblePair,
  findRandomCompatiblePartner,
  isBaseStyleIgnoredForMixing,
  isAlreadyMixedFusion,
  filterMixablePresets,
  getPresetArtists,
} from '../utils/styleCombiner';
import { ImageWithFallback } from './ArtworkPlaceholder';

interface StyleCombinerModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: StylePreset[];
  initialStyleA?: StylePreset | null;
  initialStyleB?: StylePreset | null;
  onSaveCombinedPreset: (preset: StylePreset) => void;
  onRecordCombination: (styleA: StylePreset, styleB: StylePreset, mode: BlendMode) => void;
  onOpenGuide?: () => void;
  onCopyText: (text: string, label: string) => void;
}

const SAMPLE_SUBJECTS = [
  'a cybernetic samurai warrior in rain',
  'portrait of an ethereal sorceress casting spells',
  'a futuristic sports car parked in an ancient temple',
  'a cozy isometric ramen shop in Tokyo at midnight',
  'an armored space explorer discovering a crystal nebula',
  'majestic dragon perched on a snow mountain',
];

const BLEND_MODES: { id: BlendMode; label: string; hint: string }[] = [
  { id: 'smart', label: 'Smart', hint: 'Deduplicates tokens and balances artists cleanly' },
  { id: 'weighted', label: 'Weighted', hint: 'Applies explicit A:B weight ratios' },
  { id: 'alternating', label: 'Step Matrix', hint: 'Alternates prompts across sampling steps' },
  { id: 'sequential', label: 'Sequential', hint: 'Concatenates Style A followed by Style B' },
];

interface PickerSlotProps {
  slot: 'A' | 'B';
  selected: StylePreset | null;
  otherSelected: StylePreset | null;
  mixablePresets: StylePreset[];
  isLocked: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onClosePicker: () => void;
  onSelect: (preset: StylePreset) => void;
  onToggleLock: () => void;
  onRollSingle: () => void;
  canRollSingle: boolean;
}

function CombinerSlotCard({
  slot,
  selected,
  otherSelected,
  mixablePresets,
  isLocked,
  isOpen,
  onToggleOpen,
  onClosePicker,
  onSelect,
  onToggleLock,
  onRollSingle,
  canRollSingle,
}: PickerSlotProps) {
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClosePicker();
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClosePicker]);

  const artists = useMemo(() => getPresetArtists(selected).slice(0, 4), [selected]);

  const sortedOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mapped = mixablePresets
      .map((preset) => {
        const isSameAsOther = otherSelected ? preset.id === otherSelected.id : false;
        const shared =
          otherSelected && !isSameAsOther ? getSharedArtists(preset, otherSelected) : [];
        const disabledReason = isSameAsOther
          ? `Already in Style ${slot === 'A' ? 'B' : 'A'}`
          : shared.length > 0
          ? `Shares artist: ${shared[0]}`
          : null;
        const presetArtists = getPresetArtists(preset);
        return {
          preset,
          presetArtists,
          disabledReason,
          isSelected: selected?.id === preset.id,
        };
      })
      .filter(({ preset, presetArtists }) => {
        if (!q) return true;
        return (
          preset.name.toLowerCase().includes(q) ||
          presetArtists.some((a) => a.toLowerCase().includes(q)) ||
          preset.prompt.toLowerCase().includes(q)
        );
      });

    // Sort compatible first, incompatible last; keep alphabetical within each group
    mapped.sort((a, b) => {
      const aDisabled = a.disabledReason ? 1 : 0;
      const bDisabled = b.disabledReason ? 1 : 0;
      if (aDisabled !== bDisabled) return aDisabled - bDisabled;
      return a.preset.name.localeCompare(b.preset.name);
    });

    return mapped;
  }, [mixablePresets, otherSelected, query, selected?.id, slot]);

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 min-w-0 rounded-xl border transition-colors bg-zinc-950 ${
        isLocked
          ? 'border-amber-500/50 ring-1 ring-amber-500/15'
          : 'border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Top slot bar: Label + Lock + Roll */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              slot === 'A' ? 'text-indigo-400' : 'text-purple-400'
            }`}
          >
            Style {slot}
          </span>
          {isLocked && (
            <span className="text-[11px] font-medium text-amber-400">
              Pinned
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            id={`slot-${slot.toLowerCase()}-lock-btn`}
            onClick={onToggleLock}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              isLocked
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
            }`}
            title={
              isLocked
                ? `Unlock Style ${slot}`
                : `Lock Style ${slot} so random rolls only change Style ${slot === 'A' ? 'B' : 'A'}`
            }
          >
            {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span>{isLocked ? 'Locked' : 'Lock'}</span>
          </button>

          <button
            type="button"
            id={`slot-${slot.toLowerCase()}-roll-btn`}
            onClick={onRollSingle}
            disabled={!canRollSingle}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title={`Pick another random Style ${slot} compatible with Style ${slot === 'A' ? 'B' : 'A'}`}
          >
            <Shuffle className="w-3 h-3" />
            <span>Roll</span>
          </button>
        </div>
      </div>

      {/* Clickable selected style trigger */}
      <button
        type="button"
        id={`slot-${slot.toLowerCase()}-picker-btn`}
        onClick={onToggleOpen}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-zinc-900/60 transition-colors rounded-b-xl"
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
          {selected ? (
            <ImageWithFallback
              src={selected.image_url}
              alt={selected.name}
              name={selected.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600 font-mono">
              {slot}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {selected ? selected.name : `Select Style ${slot}`}
          </p>
          <p className="text-xs text-zinc-400 truncate mt-0.5">
            {artists.length > 0 ? artists.join(' · ') : 'Custom prompt preset'}
          </p>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Searchable Picker Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl shadow-black overflow-hidden">
          <div className="p-2 border-b border-zinc-800 flex items-center gap-2 bg-black/50">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search styles or artists for Style ${slot}...`}
              className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none py-1"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-0.5 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-900">
            {sortedOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                No matching styles found.
              </div>
            ) : (
              sortedOptions.map(({ preset, presetArtists, disabledReason, isSelected }) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={Boolean(disabledReason)}
                  onClick={() => {
                    onSelect(preset);
                    onClosePicker();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    disabledReason
                      ? 'opacity-45 cursor-not-allowed bg-zinc-950'
                      : isSelected
                      ? 'bg-zinc-900 text-white'
                      : 'hover:bg-zinc-900/80 text-zinc-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                    <ImageWithFallback
                      src={preset.image_url}
                      alt={preset.name}
                      name={preset.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{preset.name}</p>
                    <p className="text-[11px] truncate text-zinc-400">
                      {disabledReason
                        ? disabledReason
                        : presetArtists.length > 0
                        ? presetArtists.slice(0, 3).join(' · ')
                        : 'Style preset'}
                    </p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StyleCombinerModal({
  isOpen,
  onClose,
  presets,
  initialStyleA,
  initialStyleB,
  onSaveCombinedPreset,
  onRecordCombination,
  onOpenGuide,
  onCopyText,
}: StyleCombinerModalProps) {
  const [styleAId, setStyleAId] = useState<string>('');
  const [styleBId, setStyleBId] = useState<string>('');
  const [lockedSlot, setLockedSlot] = useState<'A' | 'B' | null>(null);
  const [openPickerSlot, setOpenPickerSlot] = useState<'A' | 'B' | null>(null);
  const [pairHistory, setPairHistory] = useState<{ aId: string; bId: string }[]>([]);

  const [blendMode, setBlendMode] = useState<BlendMode>('smart');
  const [subject, setSubject] = useState('');
  const [sampleIndex, setSampleIndex] = useState(0);
  const [weightA, setWeightA] = useState(1.1);
  const [weightB, setWeightB] = useState(0.9);
  const [stepRatio, setStepRatio] = useState(0.5);
  const [customPresetName, setCustomPresetName] = useState('');

  const [copiedPositive, setCopiedPositive] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showNegative, setShowNegative] = useState(false);

  // Only valid non-Base, non-Fusion presets can participate in mixing
  const mixablePresets = useMemo(() => filterMixablePresets(presets), [presets]);

  // Initialize when modal opens
  useEffect(() => {
    if (!isOpen || mixablePresets.length === 0) return;

    const validInitialA =
      initialStyleA &&
      !isBaseStyleIgnoredForMixing(initialStyleA) &&
      !isAlreadyMixedFusion(initialStyleA)
        ? initialStyleA
        : null;

    const validInitialB =
      initialStyleB &&
      !isBaseStyleIgnoredForMixing(initialStyleB) &&
      !isAlreadyMixedFusion(initialStyleB)
        ? initialStyleB
        : null;

    if (!validInitialA && validInitialB) {
      const compatibleForB = getCompatibleStylesFor(validInitialB, mixablePresets);
      const partnerA =
        compatibleForB[0] ||
        mixablePresets.find((p) => p.id !== validInitialB.id) ||
        null;
      if (partnerA) setStyleAId(partnerA.id);
      setStyleBId(validInitialB.id);
      setLockedSlot('B');
    } else {
      const targetA =
        validInitialA ||
        mixablePresets.find((p) => p.id === styleAId) ||
        mixablePresets[0] ||
        null;

      if (targetA) {
        setStyleAId(targetA.id);

        let targetB = validInitialB;
        if (!targetB || targetB.id === targetA.id || haveCommonArtists(targetA, targetB)) {
          const compatible = getCompatibleStylesFor(targetA, mixablePresets);
          targetB = compatible[0] || mixablePresets.find((p) => p.id !== targetA.id) || null;
        }
        if (targetB) {
          setStyleBId(targetB.id);
        }
      }

      if (validInitialA && !validInitialB) {
        setLockedSlot('A');
      } else {
        setLockedSlot(null);
      }
    }

    setPairHistory([]);
    setOpenPickerSlot(null);
    setSavedSuccess(false);
  }, [isOpen, initialStyleA, initialStyleB, mixablePresets]);

  const styleA = useMemo(
    () => mixablePresets.find((p) => p.id === styleAId) || mixablePresets[0] || null,
    [mixablePresets, styleAId]
  );

  const styleB = useMemo(
    () =>
      mixablePresets.find((p) => p.id === styleBId) ||
      mixablePresets.find((p) => p.id !== styleA?.id) ||
      null,
    [mixablePresets, styleBId, styleA?.id]
  );

  const sharedArtists = useMemo(
    () => (styleA && styleB ? getSharedArtists(styleA, styleB) : []),
    [styleA, styleB]
  );
  const isSameStyle = Boolean(styleA && styleB && styleA.id === styleB.id);
  const hasConflict = isSameStyle || sharedArtists.length > 0;

  const combinedPositive = useMemo(() => {
    if (!styleA || !styleB) return '';
    return combinePositivePrompts(styleA, styleB, {
      mode: blendMode,
      subject,
      weightA,
      weightB,
      stepRatio,
    });
  }, [styleA, styleB, blendMode, subject, weightA, weightB, stepRatio]);

  const combinedNegative = useMemo(() => {
    if (!styleA || !styleB) return '';
    return mergeNegativePrompts(styleA.negative_prompt, styleB.negative_prompt);
  }, [styleA, styleB]);

  const compatibleCountForA = useMemo(
    () => (styleA ? getCompatibleStylesFor(styleA, mixablePresets).length : 0),
    [styleA, mixablePresets]
  );

  const compatibleCountForB = useMemo(
    () => (styleB ? getCompatibleStylesFor(styleB, mixablePresets).length : 0),
    [styleB, mixablePresets]
  );

  if (!isOpen) return null;

  const pushHistory = () => {
    if (styleA && styleB) {
      setPairHistory((prev) => [...prev.slice(-19), { aId: styleA.id, bId: styleB.id }]);
    }
  };

  const handleToggleLock = (slot: 'A' | 'B') => {
    setLockedSlot((prev) => (prev === slot ? null : slot));
  };

  const handleSwapStyles = () => {
    if (!styleA || !styleB) return;
    pushHistory();
    setStyleAId(styleB.id);
    setStyleBId(styleA.id);
    setLockedSlot((prev) => (prev === 'A' ? 'B' : prev === 'B' ? 'A' : null));
  };

  const handleRollSingleSlot = (slotToRoll: 'A' | 'B') => {
    const anchor = slotToRoll === 'A' ? styleB : styleA;
    const currentId = slotToRoll === 'A' ? styleA?.id : styleB?.id;
    if (!anchor) return;

    const partner = findRandomCompatiblePartner(anchor, mixablePresets, currentId);
    if (!partner) return;

    pushHistory();
    if (slotToRoll === 'A') {
      setStyleAId(partner.id);
    } else {
      setStyleBId(partner.id);
    }
  };

  const handleTryRandom = () => {
    if (lockedSlot === 'A' && styleA) {
      handleRollSingleSlot('B');
      return;
    }
    if (lockedSlot === 'B' && styleB) {
      handleRollSingleSlot('A');
      return;
    }

    const excludePair: [string, string] | undefined =
      styleA && styleB ? [styleA.id, styleB.id] : undefined;
    const pair = findRandomCompatiblePair(mixablePresets, excludePair);
    if (pair) {
      pushHistory();
      setStyleAId(pair[0].id);
      setStyleBId(pair[1].id);
    }
  };

  const handleUndoPair = () => {
    if (pairHistory.length === 0) return;
    const last = pairHistory[pairHistory.length - 1];
    setPairHistory((prev) => prev.slice(0, -1));
    setStyleAId(last.aId);
    setStyleBId(last.bId);
  };

  const handleCycleSampleSubject = () => {
    const next = SAMPLE_SUBJECTS[sampleIndex % SAMPLE_SUBJECTS.length];
    setSubject(next);
    setSampleIndex((prev) => prev + 1);
  };

  const handleCopyPositive = () => {
    if (!combinedPositive || hasConflict) return;
    onCopyText(combinedPositive, 'Combined Positive Prompt');
    if (styleA && styleB) {
      onRecordCombination(styleA, styleB, blendMode);
    }
    setCopiedPositive(true);
    setTimeout(() => setCopiedPositive(false), 1800);
  };

  const handleCopyNegative = () => {
    if (!combinedNegative || hasConflict) return;
    onCopyText(combinedNegative, 'Combined Negative Prompt');
    setCopiedNegative(true);
    setTimeout(() => setCopiedNegative(false), 1800);
  };

  const handleCopyFull = () => {
    if (!combinedPositive || hasConflict) return;
    const payload = combinedNegative
      ? `${combinedPositive}\n\nNegative prompt: ${combinedNegative}`
      : combinedPositive;
    onCopyText(payload, 'Full Combined Prompt');
    if (styleA && styleB) {
      onRecordCombination(styleA, styleB, blendMode);
    }
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 1800);
  };

  const handleSaveFusion = () => {
    if (!styleA || !styleB || hasConflict) return;
    try {
      const created = createCombinedPreset(styleA, styleB, customPresetName, {
        mode: blendMode,
        subject,
        weightA,
        weightB,
        stepRatio,
      });
      onSaveCombinedPreset(created);
      onRecordCombination(styleA, styleB, blendMode);
      setSavedSuccess(true);
      setCustomPresetName('');
      setTimeout(() => setSavedSuccess(false), 2200);
    } catch (err) {
      console.error('Failed to save fusion', err);
    }
  };

  const activeBlendMeta = BLEND_MODES.find((m) => m.id === blendMode) || BLEND_MODES[0];

  const primaryRandomLabel =
    lockedSlot === 'A'
      ? 'Try Random Partner for A'
      : lockedSlot === 'B'
      ? 'Try Random Partner for B'
      : 'Try Random Pair';

  const canTryRandom =
    lockedSlot === 'A'
      ? compatibleCountForA > 0
      : lockedSlot === 'B'
      ? compatibleCountForB > 0
      : mixablePresets.length >= 2;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl shadow-black overflow-hidden">
        {/* Clean Minimal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Style Combiner
            </h2>
            <span className="text-xs text-zinc-500 tabular-nums hidden sm:inline">
              {mixablePresets.length} mixable styles
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenGuide && (
              <button
                type="button"
                id="combiner-guide-btn"
                onClick={onOpenGuide}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Guide</span>
              </button>
            )}
            <button
              type="button"
              id="close-combiner-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              aria-label="Close combiner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Style Pair Selection */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <CombinerSlotCard
                slot="A"
                selected={styleA}
                otherSelected={styleB}
                mixablePresets={mixablePresets}
                isLocked={lockedSlot === 'A'}
                isOpen={openPickerSlot === 'A'}
                onToggleOpen={() =>
                  setOpenPickerSlot((prev) => (prev === 'A' ? null : 'A'))
                }
                onClosePicker={() => setOpenPickerSlot(null)}
                onSelect={(preset) => {
                  pushHistory();
                  setStyleAId(preset.id);
                }}
                onToggleLock={() => handleToggleLock('A')}
                onRollSingle={() => handleRollSingleSlot('A')}
                canRollSingle={compatibleCountForB > 0}
              />

              <div className="flex items-center justify-center shrink-0">
                <button
                  type="button"
                  id="swap-styles-btn"
                  onClick={handleSwapStyles}
                  disabled={!styleA || !styleB}
                  className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
                  title="Swap Style A and Style B"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              <CombinerSlotCard
                slot="B"
                selected={styleB}
                otherSelected={styleA}
                mixablePresets={mixablePresets}
                isLocked={lockedSlot === 'B'}
                isOpen={openPickerSlot === 'B'}
                onToggleOpen={() =>
                  setOpenPickerSlot((prev) => (prev === 'B' ? null : 'B'))
                }
                onClosePicker={() => setOpenPickerSlot(null)}
                onSelect={(preset) => {
                  pushHistory();
                  setStyleBId(preset.id);
                }}
                onToggleLock={() => handleToggleLock('B')}
                onRollSingle={() => handleRollSingleSlot('B')}
                canRollSingle={compatibleCountForA > 0}
              />
            </div>

            {/* Lock & Roll Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <p className="text-xs text-zinc-400 tabular-nums">
                {lockedSlot === 'A' && styleA ? (
                  <>
                    <span className="text-amber-300 font-medium">Style A locked</span>
                    {' · '}
                    {compatibleCountForA} compatible partners
                  </>
                ) : lockedSlot === 'B' && styleB ? (
                  <>
                    <span className="text-amber-300 font-medium">Style B locked</span>
                    {' · '}
                    {compatibleCountForB} compatible partners
                  </>
                ) : (
                  'Lock either style to keep it fixed while testing random partners'
                )}
              </p>

              <div className="flex items-center gap-2">
                {pairHistory.length > 0 && (
                  <button
                    type="button"
                    id="combiner-undo-btn"
                    onClick={handleUndoPair}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                )}

                <button
                  type="button"
                  id="combiner-random-btn"
                  onClick={handleTryRandom}
                  disabled={!canTryRandom}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-white text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>{primaryRandomLabel}</span>
                </button>
              </div>
            </div>

            {/* Inline Artist / Same-Style Conflict Banner (only when needed) */}
            {hasConflict && (
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">
                    {isSameStyle
                      ? 'Style A and Style B cannot be the same preset.'
                      : `Shared artist detected (${sharedArtists.join(', ')}). Pick a different partner.`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleTryRandom}
                  className="shrink-0 px-2.5 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium transition-colors"
                >
                  Find Compatible
                </button>
              </div>
            )}
          </div>

          {/* Compact Blend Settings + Subject */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-zinc-800/80">
            {/* Blend Mode Segmented Control */}
            <div className="md:col-span-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Blend Mode</label>
                <span className="text-[11px] text-zinc-500 truncate ml-2">
                  {activeBlendMeta.hint}
                </span>
              </div>
              <div className="grid grid-cols-4 p-1 rounded-lg bg-zinc-950 border border-zinc-800">
                {BLEND_MODES.map((mode) => {
                  const active = blendMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setBlendMode(mode.id)}
                      className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors truncate ${
                        active
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subject Input with inline Sample Cycler */}
            <div className="md:col-span-6 space-y-2">
              <label htmlFor="combiner-subject-input" className="block text-xs font-medium text-zinc-300">
                Subject <span className="text-zinc-500 font-normal">(optional)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  id="combiner-subject-input"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Leave blank for pure style blend..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-lg pl-3 pr-16 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
                <div className="absolute right-1.5 flex items-center gap-0.5">
                  {subject && (
                    <button
                      type="button"
                      onClick={() => setSubject('')}
                      className="p-1 rounded text-zinc-500 hover:text-white"
                      title="Clear subject"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    id="combiner-sample-subject-btn"
                    onClick={handleCycleSampleSubject}
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="Try a sample subject"
                  >
                    <Dices className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Mode Sliders */}
            {blendMode === 'weighted' && (
              <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Style A Weight</span>
                    <span className="font-mono text-white tabular-nums">{weightA.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.8"
                    step="0.05"
                    value={weightA}
                    onChange={(e) => setWeightA(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Style B Weight</span>
                    <span className="font-mono text-white tabular-nums">{weightB.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.8"
                    step="0.05"
                    value={weightB}
                    onChange={(e) => setWeightB(parseFloat(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {blendMode === 'alternating' && (
              <div className="md:col-span-12 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Step Transition Point</span>
                  <span className="font-mono text-white tabular-nums">
                    {Math.round(stepRatio * 100)}% Style A → Style B
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={stepRatio}
                  onChange={(e) => setStepRatio(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Combined Prompt Output */}
          <div className="space-y-3 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Combined Prompt</span>
              <div className="flex items-center gap-2">
                {combinedNegative && (
                  <button
                    type="button"
                    onClick={() => setShowNegative((prev) => !prev)}
                    className="text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    {showNegative ? 'Hide negative' : 'Show negative'}
                  </button>
                )}
                <button
                  type="button"
                  id="copy-combined-positive-btn"
                  onClick={handleCopyPositive}
                  disabled={!combinedPositive || hasConflict}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 disabled:opacity-40 transition-colors"
                >
                  {copiedPositive ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 leading-relaxed select-all min-h-[4.5rem]">
              {combinedPositive || (
                <span className="text-zinc-500">Select two compatible styles to generate a combined prompt.</span>
              )}
            </div>

            {showNegative && combinedNegative && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-400">
                    Merged Negative Prompt
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyNegative}
                    className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
                  >
                    {copiedNegative ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="font-mono text-[11px] text-zinc-400 leading-relaxed select-all">
                  {combinedNegative}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Clean Footer Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-zinc-800 bg-black/40 shrink-0">
          <input
            id="fusion-custom-name-input"
            type="text"
            value={customPresetName}
            onChange={(e) => setCustomPresetName(e.target.value)}
            placeholder={
              styleA && styleB
                ? `${styleA.name} + ${styleB.name} Fusion`
                : 'Custom fusion name (optional)...'
            }
            className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
          />

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              id="copy-full-combined-btn"
              onClick={handleCopyFull}
              disabled={!combinedPositive || hasConflict}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 disabled:opacity-40 transition-colors"
            >
              {copiedFull ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Full</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Full</span>
                </>
              )}
            </button>

            <button
              type="button"
              id="save-fusion-btn"
              onClick={handleSaveFusion}
              disabled={!styleA || !styleB || hasConflict}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved to Fusions</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Fusion</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
