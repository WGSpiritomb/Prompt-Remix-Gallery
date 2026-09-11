import { StylePreset, BlendMode, StylePairCombination } from '../types';
import { extractArtists, extractAestheticTags, enrichPreset } from './tagExtractor';

export const COMBOS_STORAGE_KEY = 'prompt_styles_pair_combinations_v1';

/**
 * Creates a canonical unique key for a pair of styles (order-independent)
 */
export function getCanonicalPairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}___${idB}` : `${idB}___${idA}`;
}

/**
 * Common quality / filler tokens that often collide when merging styles
 */
const BOILERPLATE_TOKENS = new Set([
  'masterpiece',
  'best quality',
  'high quality',
  '8k resolution',
  '8k',
  '4k',
  'highly detailed',
  'hyperdetailed',
  'ultra-detailed',
  'sharp focus',
  'trending on artstation',
  'award winning',
  'photorealistic',
]);

/**
 * Clean and split prompt into significant comma-separated chunks
 */
export function splitPromptIntoTokens(prompt: string): string[] {
  return prompt
    .replace(/\{prompt\}/gi, '')
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => Boolean(s) && s.toLowerCase() !== 'prompt');
}

/**
 * Deduplicates overlapping prompt tokens while preserving order
 */
export function deduplicateTokens(tokens: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tokens) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const norm = trimmed.toLowerCase().replace(/[{}]/g, '').trim();
    if (!norm || norm === 'prompt') continue;

    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(trimmed);
    }
  }

  return result;
}

/**
 * Merges negative prompts from Style A and Style B, deduplicating tokens
 */
export function mergeNegativePrompts(negA?: string, negB?: string): string {
  const tokensA = splitPromptIntoTokens(negA || '');
  const tokensB = splitPromptIntoTokens(negB || '');
  const merged = deduplicateTokens([...tokensA, ...tokensB]);
  return merged.join(', ');
}

/**
 * Normalizes an artist name for robust comparison (handles casing, punctuation, @ prefix, parentheses)
 */
export function normalizeArtistForComparison(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\\/g, '')
    .replace(/[()[\]{}'"]/g, ' ')
    .replace(/^@+/, '')
    .replace(/\b(art by|by|style of|in the style of|masterpiece|illustration)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns true if two artist tokens/strings represent the same artist
 */
export function doArtistsMatch(a: string, b: string): boolean {
  const normA = normalizeArtistForComparison(a);
  const normB = normalizeArtistForComparison(b);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Check matching significant words (skip common generic filler words)
  const ignored = new Set(['the', 'and', 'art', 'style', 'mix', 'studio', 'films', 'digital', 'concept']);
  const wordsA = normA.split(/\s+/).filter((w) => w.length >= 3 && !ignored.has(w));
  const wordsB = normB.split(/\s+/).filter((w) => w.length >= 3 && !ignored.has(w));

  for (const wa of wordsA) {
    if (wordsB.includes(wa)) {
      return true;
    }
  }

  // Substring match for longer names (>= 4 chars)
  if (normA.length >= 4 && normB.length >= 4) {
    if (normA.includes(normB) || normB.includes(normA)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract all artists associated with a style preset
 */
export function getPresetArtists(preset: StylePreset | null | undefined): string[] {
  if (!preset) return [];
  const list = new Set<string>();
  if (preset.derivedArtists && Array.isArray(preset.derivedArtists)) {
    for (const a of preset.derivedArtists) {
      if (a && a.trim()) list.add(a.trim());
    }
  }
  const extracted = extractArtists(`${preset.name} ${preset.prompt}`);
  for (const a of extracted) {
    if (a && a.trim()) list.add(a.trim());
  }
  return Array.from(list);
}

/**
 * Returns an array of common/shared artist names between two style presets
 */
export function getSharedArtists(
  presetA: StylePreset | null | undefined,
  presetB: StylePreset | null | undefined
): string[] {
  if (!presetA || !presetB) return [];
  if (presetA.id && presetB.id && presetA.id === presetB.id) {
    const artists = getPresetArtists(presetA);
    return artists.length > 0 ? artists : [presetA.name];
  }

  const artistsA = getPresetArtists(presetA);
  const artistsB = getPresetArtists(presetB);
  const shared: string[] = [];

  // Direct artist list comparison
  for (const a of artistsA) {
    for (const b of artistsB) {
      if (doArtistsMatch(a, b)) {
        shared.push(a);
        break;
      }
    }
  }

  // Cross-check: does prompt B contain any artist of A as a whole word?
  const promptBLower = ` ${presetB.name} ${presetB.prompt} `.toLowerCase();
  for (const a of artistsA) {
    const norm = normalizeArtistForComparison(a);
    if (norm.length >= 4) {
      const regex = new RegExp(`\\b${norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(promptBLower) && !shared.some((s) => doArtistsMatch(s, a))) {
        shared.push(a);
      }
    }
  }

  // Cross-check: does prompt A contain any artist of B as a whole word?
  const promptALower = ` ${presetA.name} ${presetA.prompt} `.toLowerCase();
  for (const b of artistsB) {
    const norm = normalizeArtistForComparison(b);
    if (norm.length >= 4) {
      const regex = new RegExp(`\\b${norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(promptALower) && !shared.some((s) => doArtistsMatch(s, b))) {
        shared.push(b);
      }
    }
  }

  return Array.from(new Set(shared));
}

/**
 * Returns true if Style A and Style B have any common artist (or are the same preset)
 */
export function haveCommonArtists(
  presetA: StylePreset | null | undefined,
  presetB: StylePreset | null | undefined
): boolean {
  if (!presetA || !presetB) return false;
  if (presetA.id && presetB.id && presetA.id === presetB.id) return true;
  return getSharedArtists(presetA, presetB).length > 0;
}

/**
 * Checks if a preset is a "Base" style that should be ignored for mixing.
 * Matches "01-Base" and any mix name containing "Base" with numbers in the front
 * (e.g., "01-Base", "01 - Base", "02_Base", "1-Base", "[01] Base", etc.).
 */
export function isBaseStyleIgnoredForMixing(
  presetOrName: StylePreset | string | null | undefined
): boolean {
  if (!presetOrName) return false;
  const name = typeof presetOrName === 'string' ? presetOrName : presetOrName.name;
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();

  // Must have numbers in the front (e.g., "01", "1", "002", "[01]", "#01", "(01)", "01-")
  const hasNumbersInFront = /^[\s#[(\-<]*\d+/.test(trimmed);
  // Must contain "Base" (case-insensitive)
  const containsBase = /base/i.test(trimmed);

  return hasNumbersInFront && containsBase;
}

/**
 * Filter out any presets that should be ignored for mixing (e.g. 01-Base)
 */
export function filterMixablePresets(presets: StylePreset[]): StylePreset[] {
  return presets.filter((p) => !isBaseStyleIgnoredForMixing(p));
}

/**
 * Determines whether a preset is a 2-style / 2-mix fusion.
 * These are excluded from CSV exports per user requirement ("do not export 2 mix fusions in the .csv").
 */
export function isTwoMixFusion(preset: StylePreset | null | undefined): boolean {
  if (!preset) return false;

  // 1. Explicit 2-parent linkage from style fusion combiner
  if (Array.isArray(preset.parentStyleIds) && preset.parentStyleIds.length === 2) {
    return true;
  }
  if (Array.isArray(preset.parentStyleNames) && preset.parentStyleNames.length === 2) {
    return true;
  }

  // 2. ID prefix generated by the 2-style combiner
  if (typeof preset.id === 'string' && preset.id.startsWith('fusion_')) {
    return true;
  }

  // 3. Preset marked as combined that is a 2-style fusion (not a 3-artist alchemy mix)
  if (preset.isCombined) {
    const isThreeArtist =
      preset.derivedTags?.includes('3-artist mix') ||
      preset.derivedTags?.includes('trio');
    if (!isThreeArtist) {
      return true;
    }
  }

  // 4. Default fusion naming pattern (e.g., "Style A + Style B Fusion" or "X + Y Blend")
  if (/\s+\+\s+.*(?:fusion|blend)/i.test(preset.name)) {
    return true;
  }

  return false;
}

/**
 * Validates whether two styles can be mixed together according to system rules:
 * 1. Neither style can be a Base style with leading numbers (e.g. 01-Base)
 * 2. They cannot be the same style
 * 3. They must not share any derived artists
 */
export function canStylesBeMixed(
  presetA: StylePreset | null | undefined,
  presetB: StylePreset | null | undefined
): { canMix: boolean; reason?: string } {
  if (!presetA || !presetB) {
    return { canMix: false, reason: 'Please select both Style A and Style B.' };
  }
  if (presetA.id && presetB.id && presetA.id === presetB.id) {
    return { canMix: false, reason: 'Cannot mix a style with itself.' };
  }
  if (isBaseStyleIgnoredForMixing(presetA)) {
    return {
      canMix: false,
      reason: `"${presetA.name}" is a Base style and is ignored for mixing.`,
    };
  }
  if (isBaseStyleIgnoredForMixing(presetB)) {
    return {
      canMix: false,
      reason: `"${presetB.name}" is a Base style and is ignored for mixing.`,
    };
  }
  const shared = getSharedArtists(presetA, presetB);
  if (shared.length > 0) {
    return {
      canMix: false,
      reason: `Styles share common artist (${shared.join(', ')}). Styles A and B cannot share artists.`,
    };
  }
  return { canMix: true };
}

/**
 * Filter presets to find only those compatible with target (i.e. having no common artists and not ignored Base styles)
 */
export function getCompatibleStylesFor(target: StylePreset, presets: StylePreset[]): StylePreset[] {
  if (isBaseStyleIgnoredForMixing(target)) return [];
  return presets.filter(
    (p) =>
      p.id !== target.id &&
      !isBaseStyleIgnoredForMixing(p) &&
      !haveCommonArtists(target, p)
  );
}

/**
 * Finds a random compatible pair from a list of presets where style A and style B have NO common artists
 * and neither is an ignored Base style.
 */
export function findRandomCompatiblePair(presets: StylePreset[]): [StylePreset, StylePreset] | null {
  const mixable = filterMixablePresets(presets);
  if (mixable.length < 2) return null;
  const shuffledA = [...mixable].sort(() => Math.random() - 0.5);
  for (const a of shuffledA) {
    const compatible = mixable.filter((b) => b.id !== a.id && !haveCommonArtists(a, b));
    if (compatible.length > 0) {
      const randomB = compatible[Math.floor(Math.random() * compatible.length)];
      return [a, randomB];
    }
  }
  return null;
}

export interface CombineOptions {
  mode: BlendMode;
  subject?: string;
  weightA?: number; // e.g. 1.0 (range 0.1 to 2.0)
  weightB?: number; // e.g. 1.0 (range 0.1 to 2.0)
  stepRatio?: number; // e.g. 0.5 (range 0.1 to 0.9 for alternating matrix)
}

/**
 * Combine Style A and Style B positive prompts according to blend mode and weights
 */
export function combinePositivePrompts(
  styleA: StylePreset,
  styleB: StylePreset,
  options: CombineOptions
): string {
  const { mode = 'smart', subject = '', weightA = 1.0, weightB = 1.0, stepRatio = 0.5 } = options;

  const rawPromptA = styleA.prompt.trim();
  const rawPromptB = styleB.prompt.trim();

  // Strip '{prompt}' marker and clean up delimiters
  const cleanPromptString = (p: string) =>
    p
      .replace(/\{prompt\}/gi, '')
      .trim()
      .replace(/^[,\s]+/, '')
      .replace(/[,\s]+$/, '')
      .replace(/,\s*,/g, ',')
      .trim();

  const cleanA = cleanPromptString(rawPromptA);
  const cleanB = cleanPromptString(rawPromptB);

  // Subject is stripped of any literal {prompt} tokens as well
  const subj = cleanPromptString(subject);

  if (mode === 'sequential') {
    // Subject, Style A, Style B
    const parts = [subj, cleanA, cleanB].filter(Boolean);
    return parts.join(', ');
  }

  if (mode === 'weighted') {
    // SD / WebUI Weight syntax: (Style A: weightA), (Style B: weightB)
    const formattedA = weightA === 1 ? cleanA : `(${cleanA}:${weightA.toFixed(2)})`;
    const formattedB = weightB === 1 ? cleanB : `(${cleanB}:${weightB.toFixed(2)})`;

    const parts = [subj, formattedA, formattedB].filter(Boolean);
    return parts.join(', ');
  }

  if (mode === 'alternating') {
    // ComfyUI / A1111 stepped prompt syntax: [{Style A} : {Style B} : {stepRatio}]
    const ratioStr = stepRatio.toFixed(2);
    const steppedBlock = `[${cleanA} : ${cleanB} : ${ratioStr}]`;
    const parts = [subj, steppedBlock].filter(Boolean);
    return parts.join(', ');
  }

  // Default: 'smart' (Smart Fusion)
  // Deduplicate tokens, merge artists intelligently, and place boilerplate at the tail
  const tokensA = splitPromptIntoTokens(cleanA);
  const tokensB = splitPromptIntoTokens(cleanB);

  const artistTokens: string[] = [];
  const aestheticTokens: string[] = [];
  const qualityTokens: string[] = [];

  const allTokens = deduplicateTokens([...tokensA, ...tokensB]);

  for (const token of allTokens) {
    const lower = token.toLowerCase();
    if (lower.startsWith('by ') || lower.startsWith('art by ') || lower.startsWith('directed by ')) {
      artistTokens.push(token);
    } else if (BOILERPLATE_TOKENS.has(lower)) {
      qualityTokens.push(token);
    } else {
      aestheticTokens.push(token);
    }
  }

  const finalParts: string[] = [];
  if (subj) finalParts.push(subj);
  if (aestheticTokens.length > 0) finalParts.push(aestheticTokens.join(', '));
  if (artistTokens.length > 0) finalParts.push(artistTokens.join(', '));
  if (qualityTokens.length > 0) finalParts.push(qualityTokens.join(', '));

  return finalParts.filter(Boolean).join(', ');
}

/**
 * Creates a new StylePreset from blending Style A and Style B
 */
export function createCombinedPreset(
  styleA: StylePreset,
  styleB: StylePreset,
  customName?: string,
  options: CombineOptions = { mode: 'smart' }
): StylePreset {
  if (isBaseStyleIgnoredForMixing(styleA)) {
    throw new Error(
      `Cannot combine styles: "${styleA.name}" is a Base style and is ignored for mixing.`
    );
  }
  if (isBaseStyleIgnoredForMixing(styleB)) {
    throw new Error(
      `Cannot combine styles: "${styleB.name}" is a Base style and is ignored for mixing.`
    );
  }
  if (haveCommonArtists(styleA, styleB)) {
    const shared = getSharedArtists(styleA, styleB);
    throw new Error(
      `Cannot combine styles: Style A and Style B share common artist(s): ${shared.join(', ')}`
    );
  }

  const combinedPositive = combinePositivePrompts(styleA, styleB, {
    ...options,
    subject: options.subject ? options.subject.replace(/\{prompt\}/gi, '').trim() : '',
  });
  const combinedNegative = mergeNegativePrompts(styleA.negative_prompt, styleB.negative_prompt);

  const defaultName = `${styleA.name.replace(/\s+preset/i, '')} + ${styleB.name.replace(/\s+preset/i, '')} Fusion`;

  const newPresetRaw: StylePreset = {
    id: `fusion_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: customName?.trim() || defaultName,
    prompt: combinedPositive,
    negative_prompt: combinedNegative,
    image_url: styleA.image_url || styleB.image_url,
    createdAt: Date.now(),
    isCombined: true,
    parentStyleIds: [styleA.id, styleB.id],
    parentStyleNames: [styleA.name, styleB.name],
    combineCount: 0,
  };

  return enrichPreset(newPresetRaw);
}

/**
 * Seed initial sample combination synergies for rich initial leaderboard
 */
export function getInitialCombinations(presets: StylePreset[]): StylePairCombination[] {
  const presetMap = new Map(presets.map((p) => [p.id, p]));

  // Curated initial combinations based on default sample presets
  const samplePairs: { idA: string; idB: string; count: number }[] = [
    { idA: 'preset_init_1', idB: 'preset_init_5', count: 48 }, // Cyberpunk + Makoto Shinkai
    { idA: 'preset_init_2', idB: 'preset_init_10', count: 35 }, // Art Nouveau + Dark Gothic
    { idA: 'preset_init_3', idB: 'preset_init_13', count: 29 }, // Studio Ghibli + Dreamy Watercolor
    { idA: 'preset_init_1', idB: 'preset_init_7', count: 24 }, // Cyberpunk + UE5 Mech
    { idA: 'preset_init_4', idB: 'preset_init_14', count: 22 }, // Epic Fantasy Oil + WLOP
    { idA: 'preset_init_6', idB: 'preset_init_8', count: 19 }, // Moebius + Ukiyo-e
    { idA: 'preset_init_11', idB: 'preset_init_12', count: 16 }, // Photorealistic Studio + Retro Synthwave
    { idA: 'preset_init_9', idB: 'preset_init_3', count: 14 }, // 3D Isometric + Ghibli
    { idA: 'preset_init_15', idB: 'preset_init_16', count: 11 }, // Vintage Botanical + Nordic Solitude
  ];

  const results: StylePairCombination[] = [];

  for (const pair of samplePairs) {
    const a = presetMap.get(pair.idA);
    const b = presetMap.get(pair.idB);
    if (a && b) {
      results.push({
        pairKey: getCanonicalPairKey(a.id, b.id),
        styleAId: a.id,
        styleBId: b.id,
        styleAName: a.name,
        styleBName: b.name,
        styleAImage: a.image_url,
        styleBImage: b.image_url,
        count: pair.count,
        lastCombinedAt: Date.now() - Math.floor(Math.random() * 86400000 * 3),
        preferredBlendMode: 'smart',
      });
    }
  }

  return results;
}

/**
 * Load combinations history from localStorage
 */
export function loadCombinations(presets: StylePreset[]): StylePairCombination[] {
  try {
    const saved = localStorage.getItem(COMBOS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const list: StylePairCombination[] | null = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.updatedCombinations)
        ? parsed.updatedCombinations
        : null;

      if (list && list.length > 0) {
        // Sync names and image URLs with current presets
        const presetMap = new Map(presets.map((p) => [p.id, p]));
        return list.map((combo) => {
          const a = presetMap.get(combo.styleAId);
          const b = presetMap.get(combo.styleBId);
          return {
            ...combo,
            styleAName: a ? a.name : combo.styleAName,
            styleBName: b ? b.name : combo.styleBName,
            styleAImage: a?.image_url || combo.styleAImage,
            styleBImage: b?.image_url || combo.styleBImage,
          };
        });
      }
    }
  } catch (e) {
    console.error('Failed to load combination stats', e);
  }
  return getInitialCombinations(presets);
}

/**
 * Records a combination event between 2 styles and returns the updated combinations list
 */
export function recordCombinationEvent(
  styleA: StylePreset | null | undefined,
  styleB: StylePreset | null | undefined,
  mode: BlendMode,
  currentCombinations: StylePairCombination[] = []
): StylePairCombination[] {
  const safeCombinations = Array.isArray(currentCombinations) ? [...currentCombinations] : [];

  if (!styleA || !styleB || !styleA.id || !styleB.id) {
    return safeCombinations;
  }

  const pairKey = getCanonicalPairKey(styleA.id, styleB.id);
  const existingIdx = safeCombinations.findIndex((c) => c && c.pairKey === pairKey);
  let newPairRecord: StylePairCombination;
  let updatedCombinations: StylePairCombination[];

  if (existingIdx >= 0) {
    const existing = safeCombinations[existingIdx];
    newPairRecord = {
      ...existing,
      count: (existing?.count || 0) + 1,
      lastCombinedAt: Date.now(),
      preferredBlendMode: mode,
      styleAName: styleA.name,
      styleBName: styleB.name,
      styleAImage: styleA.image_url,
      styleBImage: styleB.image_url,
    };
    updatedCombinations = [
      ...safeCombinations.slice(0, existingIdx),
      newPairRecord,
      ...safeCombinations.slice(existingIdx + 1),
    ];
  } else {
    newPairRecord = {
      pairKey,
      styleAId: styleA.id,
      styleBId: styleB.id,
      styleAName: styleA.name,
      styleBName: styleB.name,
      styleAImage: styleA.image_url,
      styleBImage: styleB.image_url,
      count: 1,
      lastCombinedAt: Date.now(),
      preferredBlendMode: mode,
    };
    updatedCombinations = [newPairRecord, ...safeCombinations];
  }

  // Sort by count descending
  updatedCombinations.sort((a, b) => (b.count || 0) - (a.count || 0));

  try {
    localStorage.setItem(COMBOS_STORAGE_KEY, JSON.stringify(updatedCombinations));
  } catch (e) {
    console.error('Failed to persist combination records', e);
  }

  return updatedCombinations;
}

/**
 * Delete a specific combination pair record
 */
export function deleteCombinationPair(
  pairKey: string,
  currentCombinations: StylePairCombination[] = []
): StylePairCombination[] {
  const safeCombinations = Array.isArray(currentCombinations) ? [...currentCombinations] : [];
  const updatedCombinations = safeCombinations.filter((c) => c && c.pairKey !== pairKey);

  try {
    localStorage.setItem(COMBOS_STORAGE_KEY, JSON.stringify(updatedCombinations));
  } catch (e) {
    console.error('Failed to persist updated combination records after deletion', e);
  }

  return updatedCombinations;
}

/**
 * Clear all combination records from storage
 */
export function clearAllCombinations(): StylePairCombination[] {
  try {
    localStorage.removeItem(COMBOS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear combination records', e);
  }
  return [];
}

/**
 * Reset combine count for a single style preset
 */
export function resetStyleCombineCount(
  presetId: string,
  presets: StylePreset[]
): StylePreset[] {
  return presets.map((p) => {
    if (p.id === presetId) {
      return { ...p, combineCount: 0 };
    }
    return p;
  });
}

/**
 * Reset combine count for all presets
 */
export function resetAllCombineCounts(presets: StylePreset[]): StylePreset[] {
  return presets.map((p) => ({ ...p, combineCount: 0 }));
}

/**
 * Clean artist token name for clean display and prompt building
 */
export function formatArtistForPrompt(artist: string): string {
  const trimmed = artist.trim();
  if (trimmed.startsWith('@')) {
    return trimmed;
  }
  return trimmed.replace(/^(?:art\s+by|painted\s+by|drawn\s+by|by)\s+/i, '').trim();
}

/**
 * Extract clean short name for preset naming
 */
export function getShortArtistName(artist: string): string {
  const clean = formatArtistForPrompt(artist);
  if (clean.startsWith('@')) {
    // e.g. @nyaru (nyaru 4126) -> Nyaru
    const match = clean.match(/^@([a-zA-Z0-9_\-]+)/);
    if (match) {
      const handle = match[1];
      return handle.charAt(0).toUpperCase() + handle.slice(1);
    }
  }
  // If "Greg Rutkowski" -> "Rutkowski" or "Greg Rutkowski"
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    return parts[parts.length - 1]; // Last name
  }
  return clean;
}

/**
 * Pick a single random artist from the pool, avoiding exclusions
 */
export function pickSingleRandomArtist(allArtists: string[], exclude: string[] = []): string {
  const excludeSet = new Set(exclude.map((e) => e.toLowerCase().trim()));
  const candidates = allArtists.filter((a) => !excludeSet.has(a.toLowerCase().trim()));
  const pool = candidates.length > 0 ? candidates : allArtists;
  if (pool.length === 0) return '@warashi';
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Pick 3 distinct random artists from available unique pool
 */
export function pickThreeRandomArtists(
  allArtists: string[],
  locked: (string | null)[] = [null, null, null]
): [string, string, string] {
  const selected: [string, string, string] = [
    locked[0] || '',
    locked[1] || '',
    locked[2] || '',
  ];

  const currentPicked = new Set<string>();
  if (locked[0]) currentPicked.add(locked[0].toLowerCase().trim());
  if (locked[1]) currentPicked.add(locked[1].toLowerCase().trim());
  if (locked[2]) currentPicked.add(locked[2].toLowerCase().trim());

  for (let i = 0; i < 3; i++) {
    if (!selected[i]) {
      const candidates = allArtists.filter(
        (a) => !currentPicked.has(a.toLowerCase().trim())
      );
      const chosen = pickSingleRandomArtist(candidates.length > 0 ? candidates : allArtists);
      selected[i] = chosen;
      currentPicked.add(chosen.toLowerCase().trim());
    }
  }

  return selected;
}

export type ThreeArtistBlendMode = 'clean' | 'weighted' | 'alternating' | 'art_by';

export interface ThreeArtistMixConfig {
  artists: [string, string, string];
  mode?: ThreeArtistBlendMode;
  weights?: [number, number, number];
  subject?: string;
  qualityBoost?: boolean;
}

/**
 * Generates the positive prompt for a 3-artist mix.
 * NEVER starts with '{prompt},'. Pure clean output.
 */
export function buildThreeArtistMixPrompt(config: ThreeArtistMixConfig): string {
  const {
    artists,
    mode = 'clean',
    weights = [1.1, 1.0, 0.9],
    subject = '',
    qualityBoost = false,
  } = config;

  const formattedArtists = artists.map(formatArtistForPrompt);

  let artistSegment = '';

  if (mode === 'weighted') {
    artistSegment = formattedArtists
      .map((art, idx) => `(${art}:${weights[idx].toFixed(1)})`)
      .join(', ');
  } else if (mode === 'alternating') {
    artistSegment = `[${formattedArtists[0]} | ${formattedArtists[1]} | ${formattedArtists[2]}]`;
  } else if (mode === 'art_by') {
    const allAt = formattedArtists.every((a) => a.startsWith('@'));
    artistSegment = allAt ? formattedArtists.join(', ') : `art by ${formattedArtists.join(', ')}`;
  } else {
    // Default 'clean' mode
    artistSegment = formattedArtists.join(', ');
  }

  // Quality boost
  if (qualityBoost) {
    artistSegment = `${artistSegment}, masterpiece, highly detailed, sharp focus, 8k resolution`;
  }

  // Inject subject only if explicitly supplied (never {prompt}, by default!)
  const cleanSubject = subject.replace(/\{prompt\}/gi, '').trim().replace(/^[,\s]+/, '').replace(/[,\s]+$/, '');

  if (cleanSubject) {
    return `${cleanSubject}, ${artistSegment}`;
  }

  return artistSegment;
}

/**
 * Builds an auto-generated style preset name for 3 artists
 */
export function buildThreeArtistPresetName(artists: [string, string, string]): string {
  const n1 = getShortArtistName(artists[0]);
  const n2 = getShortArtistName(artists[1]);
  const n3 = getShortArtistName(artists[2]);
  return `${n1} + ${n2} + ${n3} Trio Mix`;
}

/**
 * Builds a smart negative prompt for 3-artist mix
 */
export function buildThreeArtistNegativePrompt(
  presets: StylePreset[],
  artists: [string, string, string]
): string {
  const matchedNegatives: string[] = [];

  for (const art of artists) {
    const lower = art.toLowerCase();
    const match = presets.find(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.prompt.toLowerCase().includes(lower) ||
        (p.derivedArtists && p.derivedArtists.some((da) => da.toLowerCase() === lower))
    );
    if (match && match.negative_prompt) {
      matchedNegatives.push(match.negative_prompt);
    }
  }

  if (matchedNegatives.length > 0) {
    const tokens = matchedNegatives.flatMap((n) => splitPromptIntoTokens(n));
    const deduped = deduplicateTokens(tokens);
    if (deduped.length >= 4) {
      return deduped.slice(0, 14).join(', ');
    }
  }

  return 'blurry, low quality, deformed, bad anatomy, bad hands, watermark, signature, out of focus, duplicate';
}

