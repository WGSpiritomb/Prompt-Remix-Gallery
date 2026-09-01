import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  CheckCircle2,
  FileText,
  Sparkles,
  ArrowRight,
  Download,
  Info,
} from 'lucide-react';
import { StylePreset } from '../types';
import { parseStylesCSV, downloadCSV } from '../utils/csv';
import { enrichPreset } from '../utils/tagExtractor';
import { getInitialPresets } from '../data/sampleStyles';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newPresets: StylePreset[], mode: 'append' | 'replace') => void;
}

const SAMPLE_CSV_CONTENT = `name,prompt,negative_prompt
"Cyberpunk Neon City","{prompt}, cyberpunk neon reflections, rain-slicked futuristic street, volumetric lighting, octane render, by Syd Mead","blurry, low quality, deformed"
"Art Nouveau Elegance","{prompt}, elegant art nouveau style, floral borders, gold leaf, masterpiece, by Alphonse Mucha","photograph, 3d render, lowres"
"Studio Ghibli Pastoral","{prompt}, anime scenic landscape, lush hills, fluffy clouds, Studio Ghibli style, by Hayao Miyazaki","gritty, dark, photorealistic, 3d cgi"`;

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [importTab, setImportTab] = useState<'file' | 'paste'>('file');
  const [dragOver, setDragOver] = useState(false);
  const [rawText, setRawText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parsedPreview, setParsedPreview] = useState<{
    presets: StylePreset[];
    errors: string[];
    fileName?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const result = parseStylesCSV(text);
        const enriched = result.presets.map(enrichPreset);
        setParsedPreview({
          presets: enriched,
          errors: result.errors,
          fileName: file.name,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileProcess(file);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleParseRawText = () => {
    if (!rawText.trim()) return;
    const result = parseStylesCSV(rawText);
    const enriched = result.presets.map(enrichPreset);
    setParsedPreview({
      presets: enriched,
      errors: result.errors,
      fileName: 'Pasted CSV Data',
    });
  };

  const handleExecuteImport = () => {
    if (!parsedPreview || parsedPreview.presets.length === 0) return;
    onImport(parsedPreview.presets, importMode);
    onClose();
  };

  const handleLoadSamplePresets = () => {
    const samples = getInitialPresets();
    setParsedPreview({
      presets: samples,
      errors: [],
      fileName: 'Curated Starter Styles.csv (24 presets)',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Import styles.csv File
              </h3>
              <p className="text-xs text-zinc-400">
                Supports standard headers: <code>name,prompt,negative_prompt</code>
              </p>
            </div>
          </div>

          <button
            id="close-import-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Method Tabs */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              id="import-tab-file"
              type="button"
              onClick={() => {
                setImportTab('file');
                setParsedPreview(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                importTab === 'file'
                  ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Drag & Drop File</span>
            </button>
            <button
              id="import-tab-paste"
              type="button"
              onClick={() => {
                setImportTab('paste');
                setParsedPreview(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                importTab === 'paste'
                  ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste CSV Text</span>
            </button>
          </div>

          {/* Drag and Drop Zone */}
          {importTab === 'file' && !parsedPreview && (
            <div>
              <div
                id="csv-drop-zone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-zinc-700/80 hover:border-zinc-500 bg-zinc-950/60 hover:bg-zinc-950'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-cyan-400">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-zinc-200">
                  Click to browse or drop your <span className="text-cyan-400">styles.csv</span> here
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Supports comma-separated values, multiline quotes, and standard SD WebUI formats
                </p>
              </div>

              {/* Quick load sample or download template */}
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                <button
                  type="button"
                  id="load-sample-library-btn"
                  onClick={handleLoadSamplePresets}
                  className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Curated Starter Pack (24 styles)
                </button>

                <button
                  type="button"
                  id="download-sample-csv-btn"
                  onClick={() => downloadCSV(SAMPLE_CSV_CONTENT, 'sample_styles.csv')}
                  className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Sample styles.csv
                </button>
              </div>
            </div>
          )}

          {/* Paste Raw Text Box */}
          {importTab === 'paste' && !parsedPreview && (
            <div className="space-y-3">
              <textarea
                id="raw-csv-textarea"
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={SAMPLE_CSV_CONTENT}
                className="w-full p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRawText(SAMPLE_CSV_CONTENT)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                >
                  Fill with example template
                </button>
                <button
                  type="button"
                  id="parse-raw-csv-btn"
                  onClick={handleParseRawText}
                  disabled={!rawText.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-colors"
                >
                  Parse CSV Content
                </button>
              </div>
            </div>
          )}

          {/* Parsed Result Preview */}
          {parsedPreview && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-zinc-100">
                      Successfully parsed {parsedPreview.presets.length} presets
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      Source: {parsedPreview.fileName || 'CSV File'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setParsedPreview(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                >
                  Choose different file
                </button>
              </div>

              {/* Warnings / Errors */}
              {parsedPreview.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300 space-y-1 max-h-24 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{parsedPreview.errors.length} Warnings during parsing:</span>
                  </div>
                  {parsedPreview.errors.map((err, i) => (
                    <p key={i} className="text-[11px] text-amber-200/80">
                      • {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Sample list of detected items */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 max-h-48 overflow-y-auto divide-y divide-zinc-900 text-xs">
                {parsedPreview.presets.slice(0, 5).map((preset, i) => (
                  <div key={i} className="py-2 first:pt-0 last:pb-0">
                    <p className="font-bold text-zinc-200">{preset.name}</p>
                    <p className="text-[11px] text-zinc-400 font-mono truncate">{preset.prompt}</p>
                  </div>
                ))}
                {parsedPreview.presets.length > 5 && (
                  <p className="pt-2 text-center text-zinc-500 text-[11px]">
                    ...and {parsedPreview.presets.length - 5} more presets
                  </p>
                )}
              </div>

              {/* Import Mode: Append vs Replace */}
              <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2">
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Import Destination Mode:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-cyan-500 focus:ring-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-zinc-100">Merge / Append</p>
                      <p className="text-[10px] text-zinc-400">Keep existing presets and add imported items</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-rose-500 focus:ring-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-zinc-100">Overwrite All</p>
                      <p className="text-[10px] text-zinc-400">Replace current dataset with imported file</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <div className="text-[11px] text-zinc-500 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Exports will always use strictly: name,prompt,negative_prompt</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="cancel-import-modal-btn"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>

              {parsedPreview && (
                <button
                  type="button"
                  id="confirm-import-btn"
                  onClick={handleExecuteImport}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-950/50 transition-all"
                >
                  <span>Import {parsedPreview.presets.length} Presets</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
