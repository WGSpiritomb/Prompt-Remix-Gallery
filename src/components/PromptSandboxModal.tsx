import { useState } from 'react';
import {
  X,
  Wand2,
  Sparkles,
  Copy,
  Check,
  Ban,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { StylePreset } from '../types';
import { mergePromptWithSubject } from '../utils/tagExtractor';

interface PromptSandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: StylePreset | null;
  presets: StylePreset[];
  onSelectPreset: (preset: StylePreset) => void;
  onCopyText: (text: string, label: string) => void;
}

const SAMPLE_SUBJECTS = [
  'a mechanical armored knight standing on a cliff',
  'a futuristic cybernetic cat sitting in an alleyway',
  'portrait of an ethereal sorceress casting celestial magic',
  'an abandoned retro arcade diner surrounded by giant bonsai trees',
  'an astronaut floating inside a crystal nebula',
  'a cozy isometric ramen shop in Tokyo at midnight',
];

export function PromptSandboxModal({
  isOpen,
  onClose,
  preset,
  presets,
  onSelectPreset,
  onCopyText,
}: PromptSandboxModalProps) {
  const [subject, setSubject] = useState('a cybernetic samurai warrior');
  const [copiedCombined, setCopiedCombined] = useState(false);
  const [copiedFullBlock, setCopiedFullBlock] = useState(false);

  if (!isOpen) return null;

  const currentPreset = preset || (presets.length > 0 ? presets[0] : null);

  const combinedPositive = currentPreset
    ? mergePromptWithSubject(currentPreset.prompt, subject)
    : subject;

  const handleCopyCombined = () => {
    onCopyText(combinedPositive, 'Merged positive prompt copied!');
    setCopiedCombined(true);
    setTimeout(() => setCopiedCombined(false), 1800);
  };

  const handleCopyFullBlock = () => {
    if (!currentPreset) return;
    const fullText = `Positive:\n${combinedPositive}\n\nNegative:\n${currentPreset.negative_prompt}`;
    onCopyText(fullText, 'Full Positive + Negative Prompt block copied!');
    setCopiedFullBlock(true);
    setTimeout(() => setCopiedFullBlock(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#161b22] border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0f1117]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Prompt Merger & Sandbox
              </h3>
              <p className="text-[11px] text-slate-400">
                Test placing custom subjects into your style presets in real-time
              </p>
            </div>
          </div>

          <button
            id="close-sandbox-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preset Selector Dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-indigo-400" />
              Select Style Preset ({presets.length} available)
            </label>
            <select
              value={currentPreset?.id || ''}
              onChange={(e) => {
                const found = presets.find(p => p.id === e.target.value);
                if (found) onSelectPreset(found);
              }}
              className="w-full px-3 py-2 bg-[#0f1117] border border-slate-800 rounded-lg text-xs text-slate-200 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {presets.map(p => (
                <option key={p.id} value={p.id} className="bg-[#161b22] text-slate-200">
                  {p.name} {p.derivedArtists && p.derivedArtists.length > 0 ? `(by ${p.derivedArtists.join(', ')})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Custom Subject / Object
              </label>
              <span className="text-[10px] text-slate-500">Replaces &#123;prompt&#125; token</span>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. a futuristic samurai cat, cybernetic warrior, landscape..."
              className="w-full px-3 py-2 bg-[#0f1117] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 font-medium"
            />

            {/* Subject Sample Pills */}
            <div className="mt-2 flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-slate-500 mr-1">Quick Subjects:</span>
              {SAMPLE_SUBJECTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSubject(s)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors truncate max-w-[200px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Result Output */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            {/* Merged Positive Prompt */}
            <div className="bg-[#0f1117] rounded-lg p-3 border border-slate-800 relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Combined Positive Prompt
                </span>
                <button
                  id="sandbox-copy-combined-btn"
                  onClick={handleCopyCombined}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${
                    copiedCombined
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {copiedCombined ? (
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
              <p className="text-xs font-mono text-slate-200 leading-relaxed break-words selection:bg-indigo-500/30">
                {combinedPositive}
              </p>
            </div>

            {/* Negative Prompt */}
            {currentPreset?.negative_prompt && (
              <div className="bg-[#0f1117] rounded-lg p-3 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <Ban className="w-3 h-3" />
                    Negative Prompt
                  </span>
                  <button
                    onClick={() => {
                      onCopyText(currentPreset.negative_prompt, 'Negative prompt copied!');
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <Copy className="w-3 h-3 text-rose-400" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-xs font-mono text-slate-400 leading-relaxed break-words selection:bg-rose-500/30">
                  {currentPreset.negative_prompt}
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <p className="text-[10px] text-slate-500">
              Ready to paste into Stable Diffusion WebUI, ComfyUI, or Midjourney
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyFullBlock}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  copiedFullBlock
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                }`}
              >
                {copiedFullBlock ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Full Block!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Positive + Negative</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
