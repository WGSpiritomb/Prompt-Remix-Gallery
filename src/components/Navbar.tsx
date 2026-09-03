import { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  Table as TableIcon,
  Upload,
  Download,
  Plus,
  Trophy,
  Sparkles,
  Copy,
  FileSpreadsheet,
  Check,
  ChevronDown,
  Wand2,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { ViewMode, StylePreset } from '../types';

interface NavbarProps {
  presets: StylePreset[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showLeaderboard: boolean;
  onToggleLeaderboard: () => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onOpenSandboxModal: () => void;
  onOpenCombinerModal: () => void;
  onOpenStyleCreatorModal: () => void;
  onOpenGuideModal: () => void;
  onExportCleanCSV: () => void;
  onExportExtendedCSV: () => void;
  onCopyCSVToClipboard: () => void;
}

export function Navbar({
  presets,
  viewMode,
  onViewModeChange,
  showLeaderboard,
  onToggleLeaderboard,
  onOpenAddModal,
  onOpenImportModal,
  onOpenSandboxModal,
  onOpenCombinerModal,
  onOpenStyleCreatorModal,
  onOpenGuideModal,
  onExportCleanCSV,
  onExportExtendedCSV,
  onCopyCSVToClipboard,
}: NavbarProps) {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [copiedCSV, setCopiedCSV] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyCSV = () => {
    onCopyCSVToClipboard();
    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 2000);
    setExportMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 liquid-glass border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 border border-indigo-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                <Sparkles className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    PromptVault
                  </h1>
                  <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/[0.06] text-indigo-300 border border-white/[0.08] font-mono">
                    styles.csv
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-medium hidden sm:block">
                  Liquid Style Studio
                </p>
              </div>
            </div>
          </div>

          {/* Center: View Switcher & Leaderboard Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/30 border border-white/[0.07] backdrop-blur-md">
            <button
              id="view-mode-gallery"
              onClick={() => onViewModeChange('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'gallery'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              title="Gallery View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Gallery</span>
            </button>

            <button
              id="view-mode-table"
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              title="Spreadsheet Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Table</span>
            </button>

            <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

            <button
              id="toggle-leaderboard-btn"
              onClick={onToggleLeaderboard}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                showLeaderboard
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
              title="Toggle Artist & Tag Leaderboard"
            >
              <Trophy className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Leaderboard</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* 3-Artist Style Creator Button - Prominent Liquid Glass */}
            <button
              id="open-style-creator-btn"
              onClick={onOpenStyleCreatorModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500/25 via-purple-500/25 to-pink-500/25 hover:from-indigo-500/40 hover:to-purple-500/40 text-white border border-indigo-400/40 shadow-lg shadow-indigo-950/40 backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Style Creator: Take 3 random artists and create a mix"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
              <span>Style Creator</span>
              <span className="text-[9px] font-mono uppercase bg-black/40 px-1.5 py-0.2 rounded-full text-indigo-200 border border-indigo-500/30">
                3 Mix
              </span>
            </button>

            {/* Combine 2 Styles Studio Button */}
            <button
              id="open-combiner-btn"
              onClick={onOpenCombinerModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold liquid-glass-pill text-slate-300 hover:text-white"
              title="Combine 2 Styles Studio (Shortcut: C)"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Mix 2 Styles</span>
            </button>

            {/* Prompt Sandbox Button */}
            <button
              id="open-sandbox-btn"
              onClick={onOpenSandboxModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold liquid-glass-pill text-slate-300 hover:text-white"
              title="Test Subject with Style Prompts"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sandbox</span>
            </button>

            {/* Import Button */}
            <button
              id="import-csv-btn"
              onClick={onOpenImportModal}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold liquid-glass-pill text-slate-300 hover:text-white"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                id="export-dropdown-btn"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold liquid-glass-pill text-slate-200 hover:text-white"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden md:inline">Export</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 liquid-glass-modal rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Export styles.csv
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {presets.length} presets formatted
                    </p>
                  </div>

                  <button
                    id="export-strict-csv-btn"
                    onClick={() => {
                      onExportCleanCSV();
                      setExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left text-slate-200 hover:bg-white/[0.08] hover:text-indigo-300 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-medium">Download styles.csv</p>
                      <p className="text-[10px] text-slate-400">Strict (name, prompt, negative_prompt)</p>
                    </div>
                  </button>

                  <button
                    id="copy-csv-clipboard-btn"
                    onClick={handleCopyCSV}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left text-slate-200 hover:bg-white/[0.08] hover:text-indigo-300 transition-colors"
                  >
                    {copiedCSV ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">Copy CSV to Clipboard</p>
                      <p className="text-[10px] text-slate-400">Directly pasteable raw text</p>
                    </div>
                  </button>

                  <button
                    id="export-extended-csv-btn"
                    onClick={() => {
                      onExportExtendedCSV();
                      setExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left text-slate-200 hover:bg-white/[0.08] hover:text-indigo-300 transition-colors border-t border-white/[0.08] mt-1 pt-2"
                  >
                    <Download className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <p className="font-medium">Export with Image URLs</p>
                      <p className="text-[10px] text-slate-400">Includes image_url column</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Add Style Preset Button */}
            <button
              id="add-preset-btn"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Preset</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
