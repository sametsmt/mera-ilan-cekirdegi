// KALIP: Decorator (Yapısal) | ROL: ConcreteDecoratorA | Çözdüğü problem: Ücretli dopingle sıralama puanını bitiş tarihine kadar artırmak.
import type { Listing } from '../../domain/Listing.js';
import type { Clock } from '../../domain/types.js';
import { ListingDecorator } from './ListingDecorator.js';

export const DEFAULT_BOOST_POINTS = 50;

export interface BoostOptions {
  endsAt: Date;
  boostPoints?: number;
  clock?: Clock;
}

// GoF rolü: ConcreteDecorator (doping)
export class BoostedListing extends ListingDecorator {
  private readonly boostPoints: number;
  private readonly clock: Clock;

  constructor(
    wrapped: Listing,
    private readonly options: BoostOptions,
  ) {
    super(wrapped);
    this.boostPoints = options.boostPoints ?? DEFAULT_BOOST_POINTS;
    this.clock = options.clock ?? Date.now;
  }

  get endsAt(): Date {
    return this.options.endsAt;
  }

  private isActive(): boolean {
    return this.clock() < this.options.endsAt.getTime();
  }

  override getBadges(): string[] {
    return this.isActive() ? [...super.getBadges(), 'Doping'] : super.getBadges();
  }

  override getRankScore(): number {
    return this.isActive() ? super.getRankScore() + this.boostPoints : super.getRankScore();
  }
}
