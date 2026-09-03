import { StylePreset, ExtractedTag } from '../types';

// Predefined list of known modern digital and mix artists for accurate token extraction
const KNOWN_ARTISTS = [
  'Greg Rutkowski',
  'Makoto Shinkai',
  'WLOP',
  'Artgerm',
  'James Jean',
  'Syd Mead',
  'Moebius',
  'Jean Giraud',
  'Ilya Kuvshinov',
  'Rossdraws',
  'Hayao Miyazaki',
  'Studio Ghibli',
  'Zdzislaw Beksinski',
  'H.R. Giger',
  'HR Giger',
  'Simon Stålenhag',
  'Simon Stalenhag',
  'Craig Mullins',
  'Yoshitaka Amano',
  'Jeremy Lipking',
  'Katsuhiro Otomo',
  'Junji Ito',
  'Beeple',
  'Android Jones',
  'Loish',
  'Akira Toriyama',
  'Guweiz',
  'Fenghua Zhong',
  'Victo Ngai',
  'Benoit B. Mandelbrot',
  'Frank Frazetta',
  'Vitaly Bulgarov',
  '@warashi',
  '@ciloranko',
  '@maratang',
  '@fkey',
];

// Comprehensive traditional & classical fine-art painter exclusion list
export const TRADITIONAL_ARTIST_NAMES = new Set([
  'gustav klimt',
  'wassily kandinsky',
  'vincent van gogh',
  'claude monet',
  'rembrandt',
  'caravaggio',
  'leonardo da vinci',
  'caspar david friedrich',
  'alphonse mucha',
  'john singer sargent',
  'norman rockwell',
  'j.c. leyendecker',
  'jc leyendecker',
  'eyvind earle',
  'thomas kinkade',
  'hokusai',
  'hiroshige',
  'michelangelo',
  'edvard munch',
  'pablo picasso',
  'salvador dali',
  'paul cezanne',
  'edgar degas',
  'henri matisse',
  'william-adolphe bouguereau',
  'william adolphe bouguereau',
  'jules joseph lefebvre',
  'eugene delacroix',
  'j.m.w. turner',
  'jmw turner',
  'francisco goya',
  'johannes vermeer',
  'sandro botticelli',
  'raphael',
  'paul gauguin',
  'pierre-auguste renoir',
  'renoir',
  'gustave dore',
  'gustave doré',
  'albrecht durer',
  'albrecht dürer',
  'frederic edwin church',
  'albert bierstadt',
  'winslow homer',
  'edward hopper',
  'georgia o\'keeffe',
  'georgia okeeffe',
  'henri rousseau',
  'paul klee',
  'piet mondrian',
  'gustave courbet',
  'camille pissarro',
  'georges seurat',
]);

/**
 * Returns true if name corresponds to a traditional historical painter
 */
export function isTraditionalArtist(name: string): boolean {
  if (!name) return false;
  const clean = name
    .toLowerCase()
    .replace(/^(?:art\s+by|painted\s+by|drawn\s+by|artwork\s+by|by)\s+/i, '')
    .trim();
  // Handle tags starting with @ are digital/mix tags, never traditional
  if (clean.startsWith('@')) return false;
  return TRADITIONAL_ARTIST_NAMES.has(clean);
}

const KNOWN_TAGS_MAP: Record<string, 'medium' | 'engine' | 'lighting' | 'quality' | 'general'> = {
  // Rendering & Engine
  'octane render': 'engine',
  'unreal engine 5': 'engine',
  'unreal engine': 'engine',
  'v-ray': 'engine',
  'cycles render': 'engine',
  'ray tracing': 'engine',
  'redshift': 'engine',
  'blender 3d': 'engine',
  'unity engine': 'engine',
  'arnold render': 'engine',

  // Medium / Style
  'oil painting': 'medium',
  'watercolor': 'medium',
  'digital illustration': 'medium',
  'concept art': 'medium',
  'anime': 'medium',
  'manga': 'medium',
  'ukiyo-e': 'medium',
  'cyberpunk': 'medium',
  'steampunk': 'medium',
  'synthwave': 'medium',
  'isometric 3d': 'medium',
  'isometric': 'medium',
  'claymation': 'medium',
  'vector art': 'medium',
  'line art': 'medium',
  'charcoal sketch': 'medium',
  'pixel art': 'medium',
  '3d render': 'medium',
  'pencil drawing': 'medium',
  'gouache': 'medium',
  'ink drawing': 'medium',
  'matte painting': 'medium',
  'art nouveau': 'medium',
  'art deco': 'medium',
  'surrealism': 'medium',
  'impressionism': 'medium',
  'pop art': 'medium',

  // Lighting
  'cinematic lighting': 'lighting',
  'volumetric lighting': 'lighting',
  'golden hour': 'lighting',
  'dramatic lighting': 'lighting',
  'rim lighting': 'lighting',
  'neon glow': 'lighting',
  'bioluminescent': 'lighting',
  'soft ambient lighting': 'lighting',
  'studio lighting': 'lighting',
  'god rays': 'lighting',
  'subsurface scattering': 'lighting',
  'crepuscular rays': 'lighting',
  'hard shadows': 'lighting',

  // Quality & Modifiers
  'masterpiece': 'quality',
  'best quality': 'quality',
  '8k resolution': 'quality',
  '8k': 'quality',
  '4k': 'quality',
  'highly detailed': 'quality',
  'hyperdetailed': 'quality',
  'sharp focus': 'quality',
  'trending on artstation': 'quality',
  'photorealistic': 'quality',
  'ultra-detailed': 'quality',
  'intricate details': 'quality',
  'award winning': 'quality',
};

/**
 * Standardize capitalization for artist names
 */
function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/[\s\-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
}

/**
 * Extract artist mentions from a prompt string
 */
export function extractArtists(promptText: string): string[] {
  if (!promptText) return [];

  const foundArtists = new Set<string>();

  // 1. Direct @tag artist tokens (e.g. @nyaru \(nyaru 4126\), @nyaru (nyaru 4126), @cool-kyou shinja)
  // Preserving any parentheses \(, \), (, ), and backslashes \ exactly as written
  const chunks = promptText.split(/[,;\n|]+/);
  for (const rawChunk of chunks) {
    const chunk = rawChunk.trim();
    if (chunk.startsWith('@')) {
      if (chunk.length >= 2 && chunk.length <= 60) {
        foundArtists.add(chunk);
      }
    }
  }

  // 2. Explicit pattern matching: by / art by / style of / in the style of
  // Supports parentheses and backslashes inside artist names
  const regexPatterns = [
    /(?:art\s+by|painted\s+by|drawn\s+by|illustrated\s+by|artwork\s+by)\s+([A-Za-z0-9\s.'’\\()\-]+?)(?=[,;\n|+]|\b(?:in\s+the\s+style|art\s+by|by\b)|$)/gi,
    /(?:in\s+the\s+style\s+of|style\s+of)\s+([A-Za-z0-9\s.'’\\()\-]+?)(?=[,;\n|+]|\b(?:in\s+the\s+style|art\s+by|by\b)|$)/gi,
    /(?:^|[,;\s])by\s+([A-Za-z0-9\s.'’\\()\-]+?)(?=[,;\n|+]|\b(?:in\s+the\s+style|art\s+by|by\b)|$)/gi,
    /@([a-zA-Z0-9_\-\s\\()]+?)(?=[,;\n|+]|$)/g,
  ];

  for (const regex of regexPatterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(promptText)) !== null) {
      let candidate = match[1]?.trim();
      if (candidate && candidate.length > 2 && candidate.length < 60) {
        // If matched from @group, prefix with @ if not already, keeping \ and () intact
        if (regex.source.startsWith('@') && !candidate.startsWith('@')) {
          candidate = `@${candidate}`;
          foundArtists.add(candidate);
          continue;
        }

        // Exclude common prompt words that might match "by <word>"
        const lower = candidate.toLowerCase();
        if (
          !lower.includes('default') &&
          !lower.includes('chance') &&
          !lower.includes('itself') &&
          !lower.includes('night') &&
          !lower.includes('day') &&
          !lower.includes('far')
        ) {
          // Strictly exclude traditional historical artists
          if (isTraditionalArtist(candidate)) {
            continue;
          }

          // If the candidate contains backslashes or parentheses, preserve its exact casing and characters
          if (candidate.includes('\\') || candidate.includes('(') || candidate.includes(')')) {
            foundArtists.add(candidate);
          } else {
            foundArtists.add(titleCase(candidate));
          }
        }
      }
    }
  }

  // 3. Scan for known artist database tokens (modern mix artists only, strictly no traditional artists)
  const promptLower = promptText.toLowerCase();
  for (const artist of KNOWN_ARTISTS) {
    if (isTraditionalArtist(artist)) continue;
    const artistLower = artist.toLowerCase();
    // Match word boundaries
    const regex = new RegExp(`\\b${artistLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(promptLower)) {
      foundArtists.add(artist);
    }
  }

  return Array.from(foundArtists);
}

/**
 * Returns all unique artists found across all presets in the library.
 * Strictly uses artists already in mixes/presets, never traditional fine-art painters.
 */
export function getAllUniqueArtists(presets: StylePreset[]): string[] {
  const uniqueMap = new Map<string, string>(); // lowercase key -> display string

  for (const preset of presets) {
    const artists = preset.derivedArtists && preset.derivedArtists.length > 0
      ? preset.derivedArtists
      : extractArtists(`${preset.name} ${preset.prompt}`);

    for (const a of artists) {
      const clean = a.trim();
      if (clean && !isTraditionalArtist(clean) && !uniqueMap.has(clean.toLowerCase())) {
        uniqueMap.set(clean.toLowerCase(), clean);
      }
    }
  }

  // Fallback ONLY if the library has no artists in any preset/mix (e.g. empty library)
  if (uniqueMap.size === 0) {
    const fallbackMixArtists = [
      '@warashi',
      '@wlop',
      '@artgerm',
      '@kuvshinov',
      '@shinkai',
      '@rossdraws',
      '@loish',
      '@ciloranko',
      '@maratang',
      '@fkey',
    ];
    for (const a of fallbackMixArtists) {
      uniqueMap.set(a.toLowerCase(), a);
    }
  }

  return Array.from(uniqueMap.values()).sort((a, b) => a.localeCompare(b));
}

/**
 * Extract aesthetic, medium, engine, and quality tags
 */
export function extractAestheticTags(promptText: string): string[] {
  if (!promptText) return [];

  const foundTags = new Set<string>();
  const promptLower = promptText.toLowerCase();

  // Check against known tags
  for (const [tag] of Object.entries(KNOWN_TAGS_MAP)) {
    const regex = new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(promptLower)) {
      foundTags.add(tag);
    }
  }

  // Also parse comma-separated chunks for short keywords
  const chunks = promptText.split(/[,;\n|]+/);
  for (const rawChunk of chunks) {
    const chunk = rawChunk.trim().toLowerCase();
    if (chunk.length >= 3 && chunk.length <= 25 && !chunk.startsWith('by ') && !chunk.startsWith('art by ')) {
      if (KNOWN_TAGS_MAP[chunk]) {
        foundTags.add(chunk);
      }
    }
  }

  return Array.from(foundTags);
}

/**
 * Enriches presets with derived artists and tags
 */
export function enrichPreset(preset: StylePreset): StylePreset {
  const combinedText = `${preset.name} ${preset.prompt}`;
  return {
    ...preset,
    derivedArtists: extractArtists(combinedText),
    derivedTags: extractAestheticTags(combinedText),
  };
}

/**
 * Calculates leaderboard rankings for artists and tags across the entire preset dataset
 */
export function computeLeaderboards(presets: StylePreset[]): {
  topArtists: ExtractedTag[];
  topTags: ExtractedTag[];
  categoryBreakdown: Record<string, number>;
  totalTokensCount: number;
} {
  const artistMap = new Map<string, { count: number; presets: Set<string> }>();
  const tagMap = new Map<string, { count: number; presets: Set<string>; type: ExtractedTag['type'] }>();
  const categoryBreakdown: Record<string, number> = {
    artists: 0,
    engine: 0,
    medium: 0,
    lighting: 0,
    quality: 0,
    general: 0,
  };

  let totalTokens = 0;

  for (const preset of presets) {
    const artists = preset.derivedArtists || extractArtists(`${preset.name} ${preset.prompt}`);
    const tags = preset.derivedTags || extractAestheticTags(`${preset.name} ${preset.prompt}`);

    // Rough token count (words + punctuation)
    const words = preset.prompt.split(/\s+/).filter(Boolean).length;
    totalTokens += words;

    // Aggregate artists
    for (const artist of artists) {
      if (!artistMap.has(artist)) {
        artistMap.set(artist, { count: 0, presets: new Set() });
      }
      const item = artistMap.get(artist)!;
      item.count++;
      item.presets.add(preset.id);
      categoryBreakdown.artists++;
    }

    // Aggregate aesthetic tags
    for (const tag of tags) {
      const type = KNOWN_TAGS_MAP[tag.toLowerCase()] || 'general';
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { count: 0, presets: new Set(), type });
      }
      const item = tagMap.get(tag)!;
      item.count++;
      item.presets.add(preset.id);
      if (categoryBreakdown[type] !== undefined) {
        categoryBreakdown[type]++;
      }
    }
  }

  const topArtists: ExtractedTag[] = Array.from(artistMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      type: 'artist' as const,
      presets: Array.from(data.presets),
    }))
    .sort((a, b) => b.count - a.count);

  const topTags: ExtractedTag[] = Array.from(tagMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      type: data.type,
      presets: Array.from(data.presets),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    topArtists,
    topTags,
    categoryBreakdown,
    totalTokensCount: totalTokens,
  };
}

/**
 * Combines a custom subject prompt with a style preset.
 * If preset prompt contains `{prompt}`, it replaces `{prompt}` with subject.
 * Otherwise, appends `, <preset prompt>` to the subject.
 */
export function mergePromptWithSubject(presetPrompt: string, subject: string): string {
  if (!subject.trim()) return presetPrompt;
  if (!presetPrompt.trim()) return subject;

  if (presetPrompt.includes('{prompt}')) {
    return presetPrompt.replace(/\{prompt\}/g, subject.trim());
  }

  return `${subject.trim()}, ${presetPrompt.trim()}`;
}
