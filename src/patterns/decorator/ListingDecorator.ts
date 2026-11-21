// KALIP: Decorator (Yapısal) | ROL: Decorator | Çözdüğü problem: Doping, rozet, etiket gibi ek özellikleri ilan sınıfını değiştirmeden, iç içe ve birikimli eklemek.
import type { Listing, ListingData } from '../../domain/Listing.js';

// GoF rolü: Decorator (Component'i sarar, varsayılan olarak her şeyi ona devreder)
export abstract class ListingDecorator implements Listing {
  constructor(protected readonly wrapped: Listing) {}

  get data(): ListingData {
    return this.wrapped.data;
  }

  getBadges(): string[] {
    return this.wrapped.getBadges();
  }

  getRankScore(): number {
    return this.wrapped.getRankScore();
  }

  describe(): string {
    return this.wrapped.describe();
  }
}
