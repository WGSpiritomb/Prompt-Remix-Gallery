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
    <header className="sticky top-0 z-40 bg-[#0f1117] border-b border-slate-800 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    PromptVault <span className="text-indigo-400 font-mono text-xs font-normal">v2.4</span>
                  </h1>
                  <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                    styles.csv
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold hidden sm:block">
                  AI Style Management System
                </p>
              </div>
            </div>
          </div>

          {/* Center: View Switcher & Leaderboard Toggle */}
          <div className="flex items-center gap-1 bg-[#161b22] p-1 rounded-lg border border-slate-800">
            <button
              id="view-mode-gallery"
              onClick={() => onViewModeChange('gallery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'gallery'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Gallery View"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Gallery Grid</span>
            </button>

            <button
              id="view-mode-table"
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Spreadsheet Table View"
            >
              <TableIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Spreadsheet</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

            <button
              id="toggle-leaderboard-btn"
              onClick={onToggleLeaderboard}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                showLeaderboard
                  ? 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title="Toggle Artist & Tag Leaderboard"
            >
              <Trophy className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Leaderboard</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Combine 2 Styles Button - High Visibility */}
            <button
              id="open-combiner-btn"
              onClick={onOpenCombinerModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600/90 to-purple-600/90 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-950/50 border border-indigo-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Combine 2 Styles & Fuse Prompts (Shortcut: C)"
            >
              <Layers className="w-3.5 h-3.5 text-purple-200" />
              <span>Combine 2 Styles</span>
              <span className="hidden xl:inline text-[9px] font-mono uppercase bg-black/30 px-1 py-0.2 rounded text-indigo-200">
                Studio
              </span>
            </button>

            {/* How to Combine Quick Guide */}
            <button
              id="open-guide-btn"
              onClick={onOpenGuideModal}
              className="hidden lg:flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-indigo-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors"
              title="Learn how 2-style prompt fusion works"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Guide</span>
            </button>

            {/* Prompt Sandbox Button */}
            <button
              id="open-sandbox-btn"
              onClick={onOpenSandboxModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Test Subject with Style Prompts"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Prompt Sandbox</span>
            </button>

            {/* Import Button */}
            <button
              id="import-csv-btn"
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Import CSV</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                id="export-dropdown-btn"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span className="hidden md:inline">Export CSV</span>
                <ChevronDown className="w-3 h-3 text-indigo-200" />
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#161b22] border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Export styles.csv
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {presets.length} presets formatted
                    </p>
                  </div>

                  <button
                    id="export-strict-csv-btn"
                    onClick={() => {
                      onExportCleanCSV();
                      setExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left text-slate-200 hover:bg-slate-800 hover:text-indigo-300 transition-colors"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left text-slate-200 hover:bg-slate-800 hover:text-indigo-300 transition-colors"
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left text-slate-200 hover:bg-slate-800 hover:text-indigo-300 transition-colors border-t border-slate-800 mt-1 pt-2"
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

            <div className="w-[1px] h-6 bg-slate-800 mx-1 hidden sm:block" />

            {/* Add Style Button */}
            <button
              id="add-preset-btn"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Preset</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
