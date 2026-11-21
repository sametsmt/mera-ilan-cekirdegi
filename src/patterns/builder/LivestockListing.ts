// KALIP: Builder (Yaratımsal) | ROL: Product | Çözdüğü problem: Builder'ın ürettiği, kendi kendini tanımlayan değişmez ilan nesnesi.
import type { Listing, ListingData } from '../../domain/Listing.js';

export const BASE_RANK_SCORE = 100;

// GoF rolü: Product (Listing arayüzünün somut hali; Decorator'ın ConcreteComponent'i de budur)
export class LivestockListing implements Listing {
  constructor(readonly data: ListingData) {}

  getBadges(): string[] {
    return [];
  }

  getRankScore(): number {
    return BASE_RANK_SCORE;
  }

  describe(): string {
    return `${this.data.title} (${this.data.species}, ${this.data.price} TL, ${this.data.province})`;
  }
}
