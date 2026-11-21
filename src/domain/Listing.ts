import type { Category, ImageInput, Sex, Species } from './types.js';

export interface ListingData {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly category: Category;
  readonly species: Species;
  readonly price: number;
  readonly province: string;
  readonly photos: readonly ImageInput[];
  readonly sex?: Sex;
  readonly milkYieldLiters?: number;
  readonly pregnant?: boolean;
  readonly birthCount?: number;
  readonly earTagNo?: string;
  readonly videoUrl?: string;
}

// Hem Builder'ın ürünü hem Decorator'ın ortak arayüzü.
export interface Listing {
  readonly data: ListingData;
  getBadges(): string[];
  getRankScore(): number;
  describe(): string;
}
