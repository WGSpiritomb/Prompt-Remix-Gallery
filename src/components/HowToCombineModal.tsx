import {
  X,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  ArrowRight,
  Split,
  Copy,
  Wand2,
  Shuffle,
  FileSpreadsheet,
} from 'lucide-react';
import { StylePreset } from '../types';
import { filterMixablePresets } from '../utils/styleCombiner';

interface HowToCombineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPairToCombine: (styleAId: string, styleBId: string) => void;
  presets: StylePreset[];
}

export function HowToCombineModal({
  isOpen,
  onClose,
  onSelectPairToCombine,
  presets,
}: HowToCombineModalProps) {
  if (!isOpen) return null;

  const mixable = filterMixablePresets(presets);

  // Find popular demo pairs from mixable preset list if available
  const findPreset = (keyword: string) =>
    mixable.find(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        p.prompt.toLowerCase().includes(keyword)
    );

  const cyberpunkPreset = findPreset('cyberpunk') || mixable[0];
  const ghibliPreset = findPreset('ghibli') || mixable[1] || mixable[0];
  const ukiyoePreset = findPreset('ukiyo') || mixable[2] || mixable[0];
  const synthwavePreset = findPreset('synthwave') || mixable[3] || mixable[0];
  const oilPreset = findPreset('oil') || mixable[4] || mixable[0];
  const wlopPreset = findPreset('wlop') || mixable[5] || mixable[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#161b22] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f1117] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-950/60">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                How to Combine Styles Guide
              </h2>
              <p className="text-xs text-slate-400">
                A simple 3-step walkthrough to fuse AI art prompt styles
              </p>
            </div>
          </div>

          <button
            id="close-guide-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Step 1, 2, 3 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
              <div>
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 text-xs font-mono font-bold flex items-center justify-center mb-2.5">
                  1
                </span>
                <h3 className="font-bold text-white text-sm mb-1">Pick 2 Styles</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click <strong className="text-indigo-300">"+ Combine"</strong> on any preset card in the gallery, or use the top <strong className="text-indigo-300">"✨ Combine Styles"</strong> button in the navbar.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Base (A) + Accent (B)</span>
              </div>
            </div>

            <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full pointer-events-none" />
              <div>
                <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 border border-purple-500/40 text-xs font-mono font-bold flex items-center justify-center mb-2.5">
                  2
                </span>
                <h3 className="font-bold text-white text-sm mb-1">Select Blend Mode</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Choose how prompts merge: <strong className="text-purple-300">Smart Deduplication</strong>, <strong className="text-purple-300">Weighted Ratio</strong>, or <strong className="text-purple-300">Alternating Steps</strong>.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <Sliders className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Custom weight sliders</span>
              </div>
            </div>

            <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 rounded-bl-full pointer-events-none" />
              <div>
                <span className="w-6 h-6 rounded-full bg-pink-600/30 text-pink-400 border border-pink-500/40 text-xs font-mono font-bold flex items-center justify-center mb-2.5">
                  3
                </span>
                <h3 className="font-bold text-white text-sm mb-1">Preview & Save</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Test live on sample subjects, 1-click copy to clipboard, or click <strong className="text-pink-300">"Save as New Preset"</strong> to add into your <strong className="text-pink-300">styles.csv</strong>.
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                <FileSpreadsheet className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <span>Exports directly to CSV</span>
              </div>
            </div>
          </div>

          {/* Detailed Blend Engines Explained */}
          <div className="bg-[#0f1117] border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              4 AI Blending Engines Explained
            </h4>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-indigo-300">1. Smart Deduplication (Recommended)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">Default</span>
                </div>
                <p className="text-slate-400">
                  Combines prompt tokens while stripping repetitive boilerplates (like duplicate <em>"masterpiece, 8k, sharp focus"</em>) and keeping clean commas.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-purple-300">2. Weighted Blend Ratio</span>
                  <span className="text-[10px] font-mono text-slate-500">SD / WebUI Syntax</span>
                </div>
                <p className="text-slate-400">
                  Wraps prompts in emphasis syntax e.g. <code className="text-purple-300 font-mono">([Style A]:1.2), ([Style B]:0.8)</code> so you control which aesthetic dominates.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-pink-300">3. Alternating Diffusion Steps</span>
                  <span className="text-[10px] font-mono text-slate-500">Automatic1111 / ComfyUI</span>
                </div>
                <p className="text-slate-400">
                  Uses prompt step scheduling <code className="text-pink-300 font-mono">[Style A : Style B : 0.5]</code> to render the initial composition in Style A and finish fine details in Style B.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="font-bold text-emerald-300 block mb-1">4. Sequential Style Stacking</span>
                <p className="text-slate-400">
                  Cleanly chains: <code className="text-emerald-300 font-mono">[Subject], [Style A artists & medium], [Style B lighting & atmosphere]</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Try Popular Synergies */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Try Curated Synergy Pairs (1-Click)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {cyberpunkPreset && ghibliPreset && (
                <button
                  id="try-cyber-ghibli-btn"
                  onClick={() => {
                    onSelectPairToCombine(cyberpunkPreset.id, ghibliPreset.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition-all text-left group"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                      Cyberpunk Neon + Studio Ghibli
                    </p>
                    <p className="text-[10px] text-slate-500">Futuristic glow with lush hand-painted nature</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              {ukiyoePreset && synthwavePreset && (
                <button
                  id="try-ukiyo-synth-btn"
                  onClick={() => {
                    onSelectPairToCombine(ukiyoePreset.id, synthwavePreset.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-all text-left group"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
                      Ukiyo-e Woodblock + Retro Synthwave
                    </p>
                    <p className="text-[10px] text-slate-500">Traditional Japanese linework in 80s magenta grid</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              {oilPreset && wlopPreset && (
                <button
                  id="try-oil-wlop-btn"
                  onClick={() => {
                    onSelectPairToCombine(oilPreset.id, wlopPreset.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/50 transition-all text-left group"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-pink-300">
                      Epic Fantasy Oil + WLOP Digital Art
                    </p>
                    <p className="text-[10px] text-slate-500">Rich impasto brushwork with cinematic lighting</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#0f1117] border-t border-slate-800 flex items-center justify-end shrink-0">
          <button
            id="close-guide-footer-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Got it, Let's Combine!
          </button>
        </div>
      </div>
    </div>
  );
}
