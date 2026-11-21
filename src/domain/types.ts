// Ortak alan tipleri: kategori, tür, verdict ve görsel girdisi.

export const CATEGORIES = ['BUYUKBAS', 'KUCUKBAS', 'KANATLI'] as const;
export type Category = (typeof CATEGORIES)[number];

export const SPECIES = ['cattle', 'sheep', 'goat', 'chicken', 'turkey', 'goose', 'duck'] as const;
export type Species = (typeof SPECIES)[number];

// Tür → kategori eşleşmesinin tek tanım yeri.
export const SPECIES_CATEGORY: Record<Species, Category> = {
  cattle: 'BUYUKBAS',
  sheep: 'KUCUKBAS',
  goat: 'KUCUKBAS',
  chicken: 'KANATLI',
  turkey: 'KANATLI',
  goose: 'KANATLI',
  duck: 'KANATLI',
};

export function isSpecies(value: string): value is Species {
  return (SPECIES as readonly string[]).includes(value);
}

export type Sex = 'female' | 'male';

export type Verdict = 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';

export interface ModerationResult {
  verdict: Verdict;
  reasons: string[];
  detectedSpecies?: string;
}

export interface ImageInput {
  id: string;
  url: string;
  bytes: Buffer;
  mediaType?: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
}

// Enjekte edilebilir saat: milisaniye döner.
export type Clock = () => number;
