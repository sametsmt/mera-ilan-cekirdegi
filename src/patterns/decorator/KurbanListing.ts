// KALIP: Decorator (Yapısal) | ROL: ConcreteDecoratorC | Çözdüğü problem: Kurban dönemine özel etiketi ve sıralama avantajını ilana eklemek.
import { ListingDecorator } from './ListingDecorator.js';

export const KURBAN_POINTS = 10;

// GoF rolü: ConcreteDecorator (Kurban etiketi)
export class KurbanListing extends ListingDecorator {
  override getBadges(): string[] {
    return [...super.getBadges(), 'Kurban'];
  }

  override getRankScore(): number {
    return super.getRankScore() + KURBAN_POINTS;
  }
}
