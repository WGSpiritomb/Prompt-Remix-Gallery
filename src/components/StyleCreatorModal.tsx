import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Dices,
  Lock,
  Unlock,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Wand2,
  X,
  ChevronDown,
  Layers,
  Sliders,
  Search,
  Zap,
} from 'lucide-react';
import { StylePreset } from '../types';
import { getAllUniqueArtists } from '../utils/tagExtractor';
import {
  pickThreeRandomArtists,
  pickSingleRandomArtist,
  buildThreeArtistMixPrompt,
  buildThreeArtistPresetName,
  buildThreeArtistNegativePrompt,
  ThreeArtistBlendMode,
  formatArtistForPrompt,
} from '../utils/styleCombiner';

interface StyleCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: StylePreset[];
  onSavePreset: (newPreset: Omit<StylePreset, 'id' | 'createdAt'>) => void;
  onTestInSandbox?: (preset: StylePreset) => void;
  onCopyText: (text: string, label: string) => void;
}

export function StyleCreatorModal({
  isOpen,
  onClose,
  presets,
  onSavePreset,
  onTestInSandbox,
  onCopyText,
}: StyleCreatorModalProps) {
  // All unique artists available across the library
  const allUniqueArtists = useMemo(() => {
    return getAllUniqueArtists(presets);
  }, [presets]);

  // 3 Artist Slots state
  const [artists, setArtists] = useState<[string, string, string]>(() => {
    return pickThreeRandomArtists(allUniqueArtists);
  });

  // Locked slots (true = locked, won't change on global roll)
  const [locked, setLocked] = useState<[boolean, boolean, boolean]>([false, false, false]);

  // Mix mode
  const [blendMode, setBlendMode] = useState<ThreeArtistBlendMode>('clean');

  // Weights for weighted mode
  const [weights, setWeights] = useState<[number, number, number]>([1.1, 1.0, 0.9]);

  // Optional subject
  const [subject, setSubject] = useState('');

  // Optional quality boost
  const [qualityBoost, setQualityBoost] = useState(false);

  // Preset custom name
  const [presetName, setPresetName] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');

  // Search dropdown selector for each slot
  const [activeSlotSearch, setActiveSlotSearch] = useState<number | null>(null);
  const [slotSearchQuery, setSlotSearchQuery] = useState('');

  // UI status
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  // Initialize or re-roll when opening
  useEffect(() => {
    if (isOpen) {
      if (!artists[0] || !artists[1] || !artists[2]) {
        const fresh = pickThreeRandomArtists(allUniqueArtists);
        setArtists(fresh);
        setPresetName(buildThreeArtistPresetName(fresh));
        setNegativePrompt(buildThreeArtistNegativePrompt(presets, fresh));
      } else if (!presetName) {
        setPresetName(buildThreeArtistPresetName(artists));
        setNegativePrompt(buildThreeArtistNegativePrompt(presets, artists));
      }
      setSavedSuccess(false);
    }
  }, [isOpen, allUniqueArtists]);

  // Update name and negative prompt when artists change (unless user custom edited name)
  const updateGeneratedFields = (newArtists: [string, string, string]) => {
    setPresetName(buildThreeArtistPresetName(newArtists));
    setNegativePrompt(buildThreeArtistNegativePrompt(presets, newArtists));
    setSavedSuccess(false);
  };

  // Roll all 3 artists (respecting locks)
  const handleRollAll = () => {
    setIsRolling(true);
    const lockedValues: (string | null)[] = [
      locked[0] ? artists[0] : null,
      locked[1] ? artists[1] : null,
      locked[2] ? artists[2] : null,
    ];

    const newPicked = pickThreeRandomArtists(allUniqueArtists, lockedValues);
    setArtists(newPicked);
    updateGeneratedFields(newPicked);

    setTimeout(() => setIsRolling(false), 300);
  };

  // Re-roll a single slot
  const handleRollSlot = (slotIndex: 0 | 1 | 2) => {
    const currentOthers = artists.filter((_, idx) => idx !== slotIndex);
    const newArtist = pickSingleRandomArtist(allUniqueArtists, currentOthers);
    const updated: [string, string, string] = [...artists];
    updated[slotIndex] = newArtist;
    setArtists(updated);
    updateGeneratedFields(updated);
  };

  // Toggle lock for a slot
  const handleToggleLock = (slotIndex: 0 | 1 | 2) => {
    setLocked((prev) => {
      const next: [boolean, boolean, boolean] = [...prev];
      next[slotIndex] = !next[slotIndex];
      return next;
    });
  };

  // Select artist manually for a slot
  const handleSelectArtistForSlot = (slotIndex: 0 | 1 | 2, artist: string) => {
    const updated: [string, string, string] = [...artists];
    updated[slotIndex] = artist;
    setArtists(updated);
    updateGeneratedFields(updated);
    setActiveSlotSearch(null);
    setSlotSearchQuery('');
  };

  // Computed positive prompt
  const generatedPrompt = useMemo(() => {
    if (!artists[0] || !artists[1] || !artists[2]) return '';
    return buildThreeArtistMixPrompt({
      artists,
      mode: blendMode,
      weights,
      subject,
      qualityBoost,
    });
  }, [artists, blendMode, weights, subject, qualityBoost]);

  // Handle Save
  const handleSave = () => {
    if (!generatedPrompt) return;

    const newPresetData: Omit<StylePreset, 'id' | 'createdAt'> = {
      name: presetName.trim() || buildThreeArtistPresetName(artists),
      prompt: generatedPrompt,
      negative_prompt: negativePrompt.trim(),
      favorite: true,
      isCombined: true,
      derivedArtists: artists.map((a) => a.trim()),
      derivedTags: ['3-artist mix', 'trio', blendMode],
    };

    onSavePreset(newPresetData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  // Handle Copy Prompt
  const handleCopy = () => {
    onCopyText(generatedPrompt, '3-Artist Mix prompt copied');
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Handle Sandbox
  const handleSandbox = () => {
    if (onTestInSandbox) {
      onTestInSandbox({
        id: `preview_${Date.now()}`,
        name: presetName || '3-Artist Mix',
        prompt: generatedPrompt,
        negative_prompt: negativePrompt,
        createdAt: Date.now(),
        derivedArtists: artists,
      });
      onClose();
    }
  };

  // Filtered artists for search dropdown
  const filteredArtistsForSlot = useMemo(() => {
    if (!slotSearchQuery.trim()) return allUniqueArtists.slice(0, 30);
    const q = slotSearchQuery.toLowerCase();
    return allUniqueArtists
      .filter((a) => a.toLowerCase().includes(q))
      .slice(0, 30);
  }, [allUniqueArtists, slotSearchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="liquid-glass-modal w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.25)]">
              <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Style Creator
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  3-Artist Mix
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Picks 3 random artists from all {allUniqueArtists.length} available unique styles and blends them cleanly.
              </p>
            </div>
          </div>

          <button
            id="close-style-creator-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Big Action Bar: Roll 3 Random Artists */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/40 border border-indigo-500/20 shadow-inner">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-ping" />
              <span>
                Available Pool: <strong className="text-white font-mono">{allUniqueArtists.length}</strong> unique artists
              </span>
            </div>

            <button
              id="roll-three-artists-btn"
              onClick={handleRollAll}
              disabled={isRolling}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-950/60 border border-indigo-300/30 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isRolling ? 'opacity-80 scale-95' : ''
              }`}
            >
              <Dices className={`w-4 h-4 transition-transform duration-500 ${isRolling ? 'rotate-180' : ''}`} />
              <span>Roll 3 Random Artists</span>
            </button>
          </div>

          {/* 3 Artist Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([0, 1, 2] as const).map((slotIndex) => {
              const artist = artists[slotIndex];
              const isSlotLocked = locked[slotIndex];
              const isSearchOpen = activeSlotSearch === slotIndex;

              return (
                <div
                  key={slotIndex}
                  className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                    isSlotLocked
                      ? 'liquid-glass-card border-amber-500/40 bg-amber-950/10'
                      : 'liquid-glass-card border-white/[0.09] hover:border-indigo-500/40'
                  }`}
                >
                  {/* Card Header: Slot Badge & Action buttons */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.06]">
                      Slot 0{slotIndex + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Lock / Unlock */}
                      <button
                        id={`lock-slot-${slotIndex}`}
                        onClick={() => handleToggleLock(slotIndex)}
                        className={`p-1.5 rounded-md transition-colors text-xs ${
                          isSlotLocked
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                        }`}
                        title={isSlotLocked ? 'Unlock artist for re-roll' : 'Lock artist (keep when rolling)'}
                      >
                        {isSlotLocked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Re-roll Slot */}
                      <button
                        id={`reroll-slot-${slotIndex}`}
                        onClick={() => handleRollSlot(slotIndex)}
                        disabled={isSlotLocked}
                        className={`p-1.5 rounded-md transition-colors text-xs ${
                          isSlotLocked
                            ? 'opacity-30 cursor-not-allowed text-slate-500'
                            : 'text-slate-400 hover:text-indigo-300 hover:bg-white/[0.08]'
                        }`}
                        title="Re-roll only this artist"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      {/* Manual Search Selector */}
                      <button
                        id={`swap-slot-${slotIndex}`}
                        onClick={() => {
                          setActiveSlotSearch(isSearchOpen ? null : slotIndex);
                          setSlotSearchQuery('');
                        }}
                        className={`p-1.5 rounded-md transition-colors text-xs ${
                          isSearchOpen
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                        }`}
                        title="Pick specific artist from library"
                      >
                        <Search className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Artist Display Name */}
                  <div className="my-2">
                    <p className="text-[11px] text-slate-500 font-mono">Artist Style</p>
                    <p className="text-sm sm:text-base font-bold text-white break-words mt-0.5 font-sans">
                      {artist || 'Select Artist'}
                    </p>
                  </div>

                  {/* Format pill info */}
                  <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>
                      {artist.startsWith('@') ? 'Handle tag' : 'Traditional'}
                    </span>
                    {blendMode === 'weighted' && (
                      <span className="text-indigo-300">
                        wt: {weights[slotIndex].toFixed(1)}x
                      </span>
                    )}
                  </div>

                  {/* Search Dropdown Popup */}
                  {isSearchOpen && (
                    <div className="absolute inset-x-0 top-full mt-2 z-30 p-2 rounded-xl liquid-glass border border-indigo-500/30 shadow-2xl">
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={slotSearchQuery}
                          onChange={(e) => setSlotSearchQuery(e.target.value)}
                          placeholder="Search artists..."
                          autoFocus
                          className="w-full pl-8 pr-3 py-1.5 text-xs liquid-glass-input rounded-lg text-white placeholder-slate-500"
                        />
                      </div>
                      <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                        {filteredArtistsForSlot.map((cand) => (
                          <button
                            key={cand}
                            onClick={() => handleSelectArtistForSlot(slotIndex, cand)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                              cand.toLowerCase() === artist.toLowerCase()
                                ? 'bg-indigo-600/30 text-indigo-200 font-bold'
                                : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                            }`}
                          >
                            <span className="truncate">{cand}</span>
                            {cand.toLowerCase() === artist.toLowerCase() && (
                              <Check className="w-3 h-3 text-indigo-400 shrink-0 ml-1" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Simple Mix Options (KISS) */}
          <div className="p-4 rounded-xl liquid-glass-card border border-white/[0.08] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Blend Format
              </label>

              {/* Blend Mode Pills */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-black/40 border border-white/[0.06]">
                {(
                  [
                    { mode: 'clean', label: 'Clean Tags' },
                    { mode: 'art_by', label: 'Art by...' },
                    { mode: 'weighted', label: 'Weighted' },
                    { mode: 'alternating', label: 'Alternating' },
                  ] as const
                ).map(({ mode, label }) => (
                  <button
                    key={mode}
                    id={`blend-mode-${mode}`}
                    onClick={() => setBlendMode(mode)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      blendMode === mode
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional subject input */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="w-full sm:flex-1">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Optional custom subject (e.g. cybernetic samurai)... Leave empty for pure style"
                  className="w-full px-3 py-2 liquid-glass-input rounded-lg text-xs text-white placeholder-slate-500 font-medium"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer shrink-0 select-none">
                <input
                  type="checkbox"
                  checked={qualityBoost}
                  onChange={(e) => setQualityBoost(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                />
                <span className="text-slate-400 hover:text-slate-200">
                  + Quality Boost (8k, masterpiece)
                </span>
              </label>
            </div>
          </div>

          {/* Generated Prompt Output Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Mixed Positive Prompt (Clean Output)
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {generatedPrompt.length} chars &bull; {generatedPrompt.split(',').length} tokens
              </span>
            </div>

            {/* Output code container */}
            <div className="relative p-3.5 rounded-xl bg-black/50 border border-white/[0.08] shadow-inner">
              <p className="text-xs sm:text-sm font-mono text-emerald-300 leading-relaxed pr-10 select-all">
                {generatedPrompt}
              </p>

              <button
                id="copy-mix-prompt-btn"
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg liquid-glass-pill text-slate-400 hover:text-white"
                title="Copy Prompt"
              >
                {copiedPrompt ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Preset Name & Negative Prompt Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Preset Name
                </label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Style Preset Name"
                  className="w-full px-3 py-1.5 liquid-glass-input rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Negative Prompt
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Negative prompt tokens"
                  className="w-full px-3 py-1.5 liquid-glass-input rounded-lg text-xs text-slate-300 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-white/[0.08] bg-white/[0.02] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              id="roll-again-mix-btn"
              onClick={handleRollAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white liquid-glass-pill"
            >
              <Dices className="w-3.5 h-3.5 text-indigo-400" />
              <span>Roll Next Trio</span>
            </button>

            {onTestInSandbox && (
              <button
                id="sandbox-mix-btn"
                onClick={handleSandbox}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white liquid-glass-pill"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Test in Sandbox</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-mix-btn-footer"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white liquid-glass-pill"
            >
              {copiedPrompt ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
            </button>

            <button
              id="save-style-preset-btn"
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                savedSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 shadow-indigo-950/60 border border-white/20'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved to Presets!</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Save as Style Preset</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
