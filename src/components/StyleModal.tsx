import { useState, useEffect, FormEvent } from 'react';
import {
  X,
  Sparkles,
  Save,
  Image,
  Ban,
  Tag,
  Star,
  Users,
  Palette,
  Eye,
} from 'lucide-react';
import { StylePreset } from '../types';
import { extractArtists, extractAestheticTags } from '../utils/tagExtractor';
import { ImageWithFallback } from './ArtworkPlaceholder';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (presetData: Omit<StylePreset, 'id' | 'createdAt'> & { id?: string }) => void;
  editingPreset: StylePreset | null;
}

const COMMON_NEGATIVE_TEMPLATES = [
  {
    name: 'Universal Negative',
    text: 'blurry, low quality, deformed, bad anatomy, out of focus, duplicate, watermark, signature, jpeg artifacts',
  },
  {
    name: 'Photorealism Negative',
    text: 'cartoon, anime, 3d render, doll, plastic skin, drawing, illustration, extra fingers, bad eyes, poorly drawn face',
  },
  {
    name: 'Anime/Illustration Negative',
    text: 'photorealistic, 3d cgi, realistic photo, dirty, messy background, lowres, bad sketch, grainy',
  },
  {
    name: '3D Render Negative',
    text: 'flat 2d, sketch, painting, noisy, low poly, oversaturated, harsh lighting, amateur',
  },
];

const CURATED_SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80', // Cyberpunk
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80', // Art Nouveau
  'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80', // Nature/Ghibli
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80', // Fantasy Oil
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', // Sci-fi Line
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', // Portrait
];

export function StyleModal({
  isOpen,
  onClose,
  onSave,
  editingPreset,
}: StyleModalProps) {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState('');

  // Live extracted entities
  const [detectedArtists, setDetectedArtists] = useState<string[]>([]);
  const [detectedTags, setDetectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (editingPreset) {
      setName(editingPreset.name);
      setPrompt(editingPreset.prompt);
      setNegativePrompt(editingPreset.negative_prompt);
      setImageUrl(editingPreset.image_url || '');
      setFavorite(Boolean(editingPreset.favorite));
    } else {
      setName('');
      setPrompt('{prompt}, ');
      setNegativePrompt('blurry, low quality, deformed, bad anatomy, watermark');
      setImageUrl('');
      setFavorite(false);
    }
    setError('');
  }, [editingPreset, isOpen]);

  // Live tag calculation
  useEffect(() => {
    const combined = `${name} ${prompt}`;
    setDetectedArtists(extractArtists(combined));
    setDetectedTags(extractAestheticTags(combined));
  }, [name, prompt]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please provide a preset name.');
      return;
    }

    if (!prompt.trim()) {
      setError('Please provide a positive prompt.');
      return;
    }

    onSave({
      id: editingPreset?.id,
      name: name.trim(),
      prompt: prompt.trim(),
      negative_prompt: negativePrompt.trim(),
      image_url: imageUrl.trim() || undefined,
      favorite,
    });

    onClose();
  };

  const insertPromptToken = () => {
    if (!prompt.includes('{prompt}')) {
      setPrompt(`{prompt}, ${prompt}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-[#161b22] border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0f1117]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {editingPreset ? 'Edit Style Preset' : 'Add New Style Preset'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Format compatible with standard styles.csv for SD / WebUI / ComfyUI
              </p>
            </div>
          </div>

          <button
            id="close-style-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Preset Name & Favorite */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Preset Name <span className="text-indigo-400">*</span>
              </label>
              <input
                id="preset-form-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cyberpunk Neon City, Ghibli Scenic, Studio Portrait..."
                required
                className="w-full px-3 py-2 bg-[#0f1117] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              />
            </div>

            <div className="pt-5">
              <button
                type="button"
                id="preset-form-fav"
                onClick={() => setFavorite(!favorite)}
                className={`p-2 rounded-lg border transition-all ${
                  favorite
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-[#0f1117] border-slate-800 text-slate-500 hover:text-slate-300'
                }`}
                title="Mark as Favorite"
              >
                <Star className={`w-4 h-4 ${favorite ? 'fill-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Positive Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Positive Prompt <span className="text-indigo-400">*</span>
              </label>
              <button
                type="button"
                onClick={insertPromptToken}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-colors"
                title="Insert {prompt} placeholder where user subject will be placed"
              >
                + Insert &#123;prompt&#125;
              </button>
            </div>
            <textarea
              id="preset-form-prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. {prompt}, vibrant anime colors, scenic sky, by Makoto Shinkai, 8k resolution, masterpiece"
              required
              className="w-full px-3 py-2 bg-[#0f1117] border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 leading-relaxed"
            />

            {/* Smart Live Tag Extraction Preview */}
            {(detectedArtists.length > 0 || detectedTags.length > 0) && (
              <div className="mt-2 p-2 rounded-lg bg-[#0f1117] border border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-400" /> Detected:
                </span>
                {detectedArtists.map(artist => (
                  <span
                    key={artist}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-900/30 text-indigo-300 border border-indigo-500/30"
                  >
                    <Users className="w-2.5 h-2.5" />
                    {artist}
                  </span>
                ))}
                {detectedTags.map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Negative Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Ban className="w-3 h-3 text-rose-400" />
                Negative Prompt
              </label>
              <span className="text-[10px] text-slate-500">Optional</span>
            </div>
            <textarea
              id="preset-form-negative"
              rows={2}
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="e.g. blurry, low quality, deformed, bad anatomy, out of focus, watermark"
              className="w-full px-3 py-2 bg-[#0f1117] border border-slate-800 rounded-lg text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 leading-relaxed"
            />

            {/* Quick Negative Template Badges */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-slate-500 mr-1">Templates:</span>
              {COMMON_NEGATIVE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => setNegativePrompt(tmpl.text)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL (Optional preview) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Image className="w-3 h-3 text-indigo-400" />
              Artwork Preview Image URL <span className="text-slate-500 text-[10px] font-normal">(Optional)</span>
            </label>
            <input
              id="preset-form-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (direct image link or leave blank for generative art badge)"
              className="w-full px-3 py-2 bg-[#0f1117] border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            />

            {/* Sample Image Palette Picker */}
            <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[10px] text-slate-500 shrink-0">Sample Images:</span>
              {CURATED_SAMPLE_IMAGES.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setImageUrl(img)}
                  className={`w-7 h-7 rounded-lg overflow-hidden border shrink-0 transition-all ${
                    imageUrl === img ? 'border-indigo-400 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Sample" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Mini Live Card Preview */}
          <div className="pt-3 border-t border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Card Preview:
            </p>
            <div className="p-2.5 bg-[#0f1117] rounded-lg border border-slate-800 flex items-center gap-3">
              <div className="w-14 h-10 rounded overflow-hidden shrink-0 border border-slate-800">
                <ImageWithFallback
                  src={imageUrl}
                  alt={name || 'Preset'}
                  name={name || 'Style Name'}
                  artists={detectedArtists}
                  tags={detectedTags}
                  className="w-full h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate">{name || 'Style Preset Name'}</p>
                <p className="text-[10px] font-mono text-slate-400 line-clamp-1 mt-0.5">
                  {prompt || 'Prompt text will appear here...'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              id="cancel-style-modal-btn"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-style-modal-btn"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{editingPreset ? 'Update Preset' : 'Save Style Preset'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
