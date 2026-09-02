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
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Deduplicates overlapping prompt tokens while preserving order
 */
export function deduplicateTokens(tokens: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tokens) {
    const norm = raw.toLowerCase().replace(/[{}]/g, '').trim();
    if (!norm) continue;

    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(raw);
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

  // Strip '{prompt}' marker from style prompts for clean composition
  const cleanA = rawPromptA.replace(/\{prompt\}/g, '').trim().replace(/^,\s*/, '').replace(/,\s*$/, '');
  const cleanB = rawPromptB.replace(/\{prompt\}/g, '').trim().replace(/^,\s*/, '').replace(/,\s*$/, '');

  const subj = subject.trim();

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
  const combinedPositive = combinePositivePrompts(styleA, styleB, {
    ...options,
    subject: '{prompt}',
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
