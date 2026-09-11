import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Layers,
  Sparkles,
  ArrowLeftRight,
  Copy,
  Check,
  Ban,
  Save,
  Shuffle,
  Sliders,
  Flame,
  Plus,
  Users,
  Tag,
  ArrowRight,
  Info,
  AlertTriangle,
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
} from '../utils/styleCombiner';
import { ImageWithFallback } from './ArtworkPlaceholder';
import { extractArtists, extractAestheticTags } from '../utils/tagExtractor';

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
  const [blendMode, setBlendMode] = useState<BlendMode>('smart');
  const [subject, setSubject] = useState('');
  const [weightA, setWeightA] = useState(1.1);
  const [weightB, setWeightB] = useState(0.9);
  const [stepRatio, setStepRatio] = useState(0.5);
  const [customPresetName, setCustomPresetName] = useState('');

  const [copiedPositive, setCopiedPositive] = useState(false);
  const [copiedNegative, setCopiedNegative] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Initialize or reset selected styles when modal opens
  useEffect(() => {
    if (!isOpen || presets.length === 0) return;

    const targetA =
      initialStyleA || presets.find((p) => p.id === styleAId) || presets[0];
    if (targetA) {
      setStyleAId(targetA.id);

      let targetB = initialStyleB;
      if (!targetB || targetB.id === targetA.id || haveCommonArtists(targetA, targetB)) {
        const compatible = getCompatibleStylesFor(targetA, presets);
        targetB = compatible[0] || presets.find((p) => p.id !== targetA.id) || null;
      }
      if (targetB) {
        setStyleBId(targetB.id);
      }
    }

    setSavedSuccess(false);
  }, [isOpen, initialStyleA, initialStyleB, presets]);

  // Derived current Style A & Style B
  const styleA = useMemo(
    () => presets.find((p) => p.id === styleAId) || presets[0] || null,
    [presets, styleAId]
  );

  const styleB = useMemo(
    () =>
      presets.find((p) => p.id === styleBId) ||
      presets.find((p) => p.id !== styleAId && !haveCommonArtists(styleA, p)) ||
      presets.find((p) => p.id !== styleAId) ||
      presets[1] ||
      null,
    [presets, styleBId, styleAId, styleA]
  );

  // Common artist analysis between Style A and Style B
  const sharedArtists = useMemo(
    () => getSharedArtists(styleA, styleB),
    [styleA, styleB]
  );
  const hasCommonArtist = sharedArtists.length > 0;

  // Auto-generate suggested name when styles change
  useEffect(() => {
    if (styleA && styleB) {
      const cleanAName = styleA.name.replace(/\s+preset|\s+style/gi, '');
      const cleanBName = styleB.name.replace(/\s+preset|\s+style/gi, '');
      setCustomPresetName(`${cleanAName} + ${cleanBName} Fusion`);
    }
  }, [styleA, styleB]);

  if (!isOpen || !styleA || !styleB) return null;

  // Real-time combined positive & negative outputs
  const combinedPositivePrompt = combinePositivePrompts(styleA, styleB, {
    mode: blendMode,
    subject,
    weightA,
    weightB,
    stepRatio,
  });

  const combinedNegativePrompt = mergeNegativePrompts(
    styleA.negative_prompt,
    styleB.negative_prompt
  );

  // Derived combined metadata
  const derivedArtists = Array.from(
    new Set([...(styleA.derivedArtists || []), ...(styleB.derivedArtists || [])])
  );
  const derivedTags = Array.from(
    new Set([...(styleA.derivedTags || []), ...(styleB.derivedTags || [])])
  );

  const totalTokens = combinedPositivePrompt.split(/\s+/).filter(Boolean).length;

  // Swap Style A and Style B
  const handleSwapStyles = () => {
    const tempA = styleAId;
    setStyleAId(styleBId);
    setStyleBId(tempA);
  };

  // Change Style A with smart auto-switch for Style B if it would create an artist conflict
  const handleSelectStyleA = (newAId: string) => {
    setStyleAId(newAId);
    const newA = presets.find((p) => p.id === newAId);
    if (newA && styleB && (newA.id === styleB.id || haveCommonArtists(newA, styleB))) {
      const compatible = getCompatibleStylesFor(newA, presets);
      if (compatible.length > 0) {
        setStyleBId(compatible[0].id);
      }
    }
  };

  // Pick a random pair of styles that share NO common artists
  const handleRandomPair = () => {
    if (presets.length < 2) return;
    const compatiblePair = findRandomCompatiblePair(presets);
    if (compatiblePair) {
      const [a, b] = compatiblePair;
      setStyleAId(a.id);
      setStyleBId(b.id);
    }
  };

  const handleCopyPositive = () => {
    onCopyText(combinedPositivePrompt, 'Blended Positive Prompt copied!');
    onRecordCombination(styleA, styleB, blendMode);
    setCopiedPositive(true);
    setTimeout(() => setCopiedPositive(false), 1800);
  };

  const handleCopyNegative = () => {
    onCopyText(combinedNegativePrompt, 'Merged Negative Prompt copied!');
    setCopiedNegative(true);
    setTimeout(() => setCopiedNegative(false), 1800);
  };

  const handleCopyFullBlock = () => {
    const fullText = `Positive:\n${combinedPositivePrompt}\n\nNegative:\n${combinedNegativePrompt}`;
    onCopyText(fullText, 'Full Blended Prompt Block copied!');
    onRecordCombination(styleA, styleB, blendMode);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 1800);
  };

  const handleSaveAsPreset = () => {
    if (hasCommonArtist) {
      return;
    }
    const newPreset = createCombinedPreset(styleA, styleB, customPresetName, {
      mode: blendMode,
      weightA,
      weightB,
      stepRatio,
    });

    onSaveCombinedPreset(newPreset);
    onRecordCombination(styleA, styleB, blendMode);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#161b22] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0f1117] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Style Combiner & Fusion Studio
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-900/40 text-indigo-300 border border-indigo-500/30">
                  Dual-Style Synergy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Blend two style blueprints with custom weights, step ratios, and smart token deduplication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenGuide && (
              <button
                id="combiner-guide-btn"
                onClick={() => {
                  onClose();
                  onOpenGuide();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 transition-colors"
                title="How does combining work? (Guide & algorithms)"
              >
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Guide</span>
              </button>
            )}

            <button
              id="combiner-random-btn"
              onClick={handleRandomPair}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Pick a random style pairing"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Surprise Pair</span>
            </button>

            <button
              id="close-combiner-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Dual Style Selector Panel */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-center">
            {/* Style A Card */}
            <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between h-full group hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/60">
                  Style Blueprint A
                </span>
                {styleA.combineCount !== undefined && (
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" /> {styleA.combineCount} fusions
                  </span>
                )}
              </div>

              {/* Selector dropdown */}
              <select
                id="select-style-a"
                value={styleAId}
                onChange={(e) => handleSelectStyleA(e.target.value)}
                aria-label="Select Style Blueprint A"
                className="w-full px-2.5 py-1.5 bg-[#161b22] border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer mb-2.5"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#161b22] text-slate-200">
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Visual Preview of Style A */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                  <ImageWithFallback
                    src={styleA.image_url}
                    alt={styleA.name}
                    name={styleA.name}
                    artists={styleA.derivedArtists}
                    tags={styleA.derivedTags}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{styleA.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                    {styleA.prompt}
                  </p>
                </div>
              </div>

              {/* Artist Chips */}
              {styleA.derivedArtists && styleA.derivedArtists.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {styleA.derivedArtists.map((artist) => (
                    <span
                      key={artist}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-900/30 text-indigo-300 border border-indigo-500/20 font-medium"
                    >
                      by {artist}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Middle Swap Button */}
            <div className="flex justify-center">
              <button
                id="swap-styles-btn"
                onClick={handleSwapStyles}
                className="p-2.5 rounded-full bg-[#161b22] hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500 shadow-lg transition-all hover:rotate-180 duration-300"
                title="Swap Style A and Style B"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Style B Card */}
            <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between h-full group hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/60">
                  Style Blueprint B
                </span>
                {styleB.combineCount !== undefined && (
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" /> {styleB.combineCount} fusions
                  </span>
                )}
              </div>

              {/* Selector dropdown */}
              <select
                id="select-style-b"
                value={styleBId}
                onChange={(e) => setStyleBId(e.target.value)}
                aria-label="Select Style Blueprint B"
                className="w-full px-2.5 py-1.5 bg-[#161b22] border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer mb-2.5"
              >
                {presets.map((p) => {
                  const isSame = p.id === styleA.id;
                  const conflicts = !isSame && haveCommonArtists(styleA, p);
                  const conflictArtists = conflicts ? getSharedArtists(styleA, p) : [];
                  return (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={isSame || conflicts}
                      className={
                        conflicts || isSame
                          ? 'text-zinc-500 bg-zinc-900'
                          : 'bg-[#161b22] text-slate-200'
                      }
                    >
                      {p.name}
                      {isSame
                        ? ' (Current Style A)'
                        : conflicts
                        ? ` — Incompatible (Shares: ${conflictArtists.join(', ')})`
                        : ''}
                    </option>
                  );
                })}
              </select>

              {/* Visual Preview of Style B */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                  <ImageWithFallback
                    src={styleB.image_url}
                    alt={styleB.name}
                    name={styleB.name}
                    artists={styleB.derivedArtists}
                    tags={styleB.derivedTags}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{styleB.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                    {styleB.prompt}
                  </p>
                </div>
              </div>

              {/* Artist Chips */}
              {styleB.derivedArtists && styleB.derivedArtists.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {styleB.derivedArtists.map((artist) => (
                    <span
                      key={artist}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-500/20 font-medium"
                    >
                      by {artist}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Common Artist Conflict Alert Banner */}
          {hasCommonArtist && (
            <div
              id="combiner-common-artist-alert"
              className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 animate-in fade-in shadow-lg"
            >
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-rose-200 flex items-center gap-2">
                  <span>Cannot Mix: Common Artist Detected</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-700">
                    {sharedArtists.join(', ')}
                  </span>
                </p>
                <p className="text-rose-300/80 leading-relaxed">
                  Style A and Style B must not have any common artist. Please select a different Style B or Style A that does not feature {sharedArtists.join(', ')}.
                </p>
              </div>
            </div>
          )}

          {/* Fusion Strategy / Blend Mode Selector */}
          <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Combination Mode & Syntax
              </label>
              <span className="text-[10px] text-slate-500">
                SD / WebUI / ComfyUI Syntax Ready
              </span>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                id="blend-mode-smart"
                type="button"
                onClick={() => setBlendMode('smart')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  blendMode === 'smart'
                    ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#161b22] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-300">Smart Fusion</span>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Deduplicates tokens & merges aesthetic tags
                </p>
              </button>

              <button
                id="blend-mode-weighted"
                type="button"
                onClick={() => setBlendMode('weighted')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  blendMode === 'weighted'
                    ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#161b22] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-300">Weighted Ratio</span>
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  SD syntax: (Style A: 1.2), (Style B: 0.8)
                </p>
              </button>

              <button
                id="blend-mode-alternating"
                type="button"
                onClick={() => setBlendMode('alternating')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  blendMode === 'alternating'
                    ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#161b22] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-300">Step Matrix</span>
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Comfy / A1111: [Style A : Style B : 0.5]
                </p>
              </button>

              <button
                id="blend-mode-sequential"
                type="button"
                onClick={() => setBlendMode('sequential')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  blendMode === 'sequential'
                    ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#161b22] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-indigo-300">Sequential</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Direct clean sequence: Style A, Style B
                </p>
              </button>
            </div>

            {/* Secondary Controls for Weighted & Alternating modes */}
            {blendMode === 'weighted' && (
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Style A Weight:</span>
                    <span className="font-mono text-indigo-400 font-bold">{weightA.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.8"
                    step="0.05"
                    value={weightA}
                    onChange={(e) => setWeightA(parseFloat(e.target.value))}
                    aria-label="Style A Weight slider"
                    className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400 font-medium">Style B Weight:</span>
                    <span className="font-mono text-purple-400 font-bold">{weightB.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.8"
                    step="0.05"
                    value={weightB}
                    onChange={(e) => setWeightB(parseFloat(e.target.value))}
                    aria-label="Style B Weight slider"
                    className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {blendMode === 'alternating' && (
              <div className="pt-2 border-t border-slate-800/80 animate-in fade-in">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">
                    Step Transition Switch Ratio (Style A ➔ Style B):
                  </span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {Math.round(stepRatio * 100)}% steps
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={stepRatio}
                  onChange={(e) => setStepRatio(parseFloat(e.target.value))}
                  aria-label="Step Transition Switch Ratio slider"
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Custom Subject Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Custom Subject / Focal Object (Optional)
              </label>
              {subject ? (
                <button
                  type="button"
                  onClick={() => setSubject('')}
                  className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Clear Subject (Pure Style)
                </button>
              ) : (
                <span className="text-[10px] text-slate-500">Pure style blend active</span>
              )}
            </div>
            <input
              id="combiner-subject-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Leave empty for pure style prompt, or type a subject (e.g. samurai warrior, landscape)..."
              className="w-full px-3 py-2 bg-[#0f1117] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium"
            />

            {/* Quick Sample Pills */}
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-slate-500 mr-1">Quick Subjects:</span>
              {SAMPLE_SUBJECTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSubject(s)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors truncate max-w-[220px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Result Output Block */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* Positive Prompt */}
            <div className="bg-[#0f1117] rounded-xl p-3.5 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Combined Positive Prompt
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                    {totalTokens} tokens
                  </span>
                </div>

                <button
                  id="combiner-copy-positive-btn"
                  onClick={handleCopyPositive}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    copiedPositive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {copiedPositive ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-indigo-400" />
                      <span>Copy Positive</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs font-mono text-slate-200 leading-relaxed break-words max-h-36 overflow-y-auto selection:bg-indigo-500/30">
                {combinedPositivePrompt}
              </p>

              {/* Derived Artists & Aesthetic Badges Preview */}
              {(derivedArtists.length > 0 || derivedTags.length > 0) && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 flex items-center gap-1">
                    Inherited:
                  </span>
                  {derivedArtists.map((artist) => (
                    <span
                      key={artist}
                      className="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-300 border border-indigo-500/30"
                    >
                      <Users className="w-2.5 h-2.5" />
                      by {artist}
                    </span>
                  ))}
                  {derivedTags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Merged Negative Prompt */}
            {combinedNegativePrompt && (
              <div className="bg-[#0f1117] rounded-xl p-3 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <Ban className="w-3 h-3" />
                      Deduplicated Negative Prompt
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      (merged from both styles)
                    </span>
                  </div>

                  <button
                    id="combiner-copy-negative-btn"
                    onClick={handleCopyNegative}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                      copiedNegative
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {copiedNegative ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-rose-400" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>

                <p className="text-xs font-mono text-slate-400 leading-relaxed break-words max-h-24 overflow-y-auto selection:bg-rose-500/30">
                  {combinedNegativePrompt}
                </p>
              </div>
            )}
          </div>

          {/* Preset Saving Section */}
          <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Save as Library Style Preset
              </label>
              <input
                type="text"
                value={customPresetName}
                onChange={(e) => setCustomPresetName(e.target.value)}
                placeholder="Name for this new combined preset..."
                className="w-full px-2.5 py-1.5 bg-[#0f1117] border border-slate-700 rounded-lg text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="shrink-0 flex items-end">
              <button
                id="save-combined-preset-btn"
                type="button"
                onClick={handleSaveAsPreset}
                disabled={hasCommonArtist || !customPresetName.trim() || savedSuccess}
                title={
                  hasCommonArtist
                    ? `Cannot save: Styles share artist (${sharedArtists.join(', ')})`
                    : !customPresetName.trim()
                    ? 'Enter a preset name'
                    : 'Save blended preset to library'
                }
                className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                  savedSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-950/50'
                    : hasCommonArtist
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
                    : 'bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved to Styles!</span>
                  </>
                ) : hasCommonArtist ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Cannot Mix (Shared Artist)</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save to Library</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0f1117] flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <p className="text-[11px] text-slate-500 font-mono">
            Synergy logged to leaderboards &bull; Compatible with styles.csv
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              id="combiner-copy-full-btn"
              onClick={handleCopyFullBlock}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                copiedFull
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
              }`}
            >
              {copiedFull ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Full Block!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Pos + Neg Block</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
