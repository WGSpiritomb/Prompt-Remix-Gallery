export interface StylePreset {
  id: string;
  name: string;
  prompt: string;
  negative_prompt: string;
  image_url?: string;
  favorite?: boolean;
  createdAt: number;
  updatedAt?: number;
  derivedArtists?: string[];
  derivedTags?: string[];
  combineCount?: number;
  isCombined?: boolean;
  parentStyleIds?: [string, string];
  parentStyleNames?: [string, string];
}

export type ViewMode = 'gallery' | 'table';

export type SortOption =
  | 'name_asc'
  | 'name_desc'
  | 'newest'
  | 'oldest'
  | 'most_combined'
  | 'longest_prompt'
  | 'shortest_prompt'
  | 'favorites_first';

export type BlendMode = 'smart' | 'weighted' | 'alternating' | 'sequential';

export interface StylePairCombination {
  pairKey: string; // canonical "idA___idB"
  styleAId: string;
  styleBId: string;
  styleAName: string;
  styleBName: string;
  styleAImage?: string;
  styleBImage?: string;
  count: number;
  lastCombinedAt: number;
  preferredBlendMode?: BlendMode;
}

export interface ExtractedTag {
  name: string;
  count: number;
  type: 'artist' | 'medium' | 'engine' | 'lighting' | 'quality' | 'general';
  presets: string[]; // IDs of presets containing this tag
}

export interface CSVParseResult {
  presets: StylePreset[];
  errors: string[];
  totalRows: number;
  validRows: number;
  ignoredHeaders?: string[];
}

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

