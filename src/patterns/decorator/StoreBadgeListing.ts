// KALIP: Decorator (Yapısal) | ROL: ConcreteDecoratorB | Çözdüğü problem: Kurumsal mağaza rozetini ve küçük sıralama avantajını ilana eklemek.
import type { Listing } from '../../domain/Listing.js';
import { ListingDecorator } from './ListingDecorator.js';

export const STORE_BADGE_POINTS = 20;

// GoF rolü: ConcreteDecorator (kurumsal mağaza rozeti)
export class StoreBadgeListing extends ListingDecorator {
  constructor(
    wrapped: Listing,
    private readonly storeName: string,
  ) {
    super(wrapped);
  }

  override getBadges(): string[] {
    return [...super.getBadges(), `Kurumsal Mağaza: ${this.storeName}`];
  }

  override getRankScore(): number {
    return super.getRankScore() + STORE_BADGE_POINTS;
  }
}
