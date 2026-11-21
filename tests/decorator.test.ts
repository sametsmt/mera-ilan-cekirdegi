import { describe, expect, it } from 'vitest';
import { BASE_RANK_SCORE } from '../src/patterns/builder/LivestockListing.js';
import { BoostedListing, DEFAULT_BOOST_POINTS } from '../src/patterns/decorator/BoostedListing.js';
import { KURBAN_POINTS, KurbanListing } from '../src/patterns/decorator/KurbanListing.js';
import { STORE_BADGE_POINTS, StoreBadgeListing } from '../src/patterns/decorator/StoreBadgeListing.js';
import { validListing } from './helpers.js';

const future = new Date(2030, 0, 1);

describe('Decorator: ListingDecorator', () => {
  it('çıplak ilanın rozeti yok, puanı taban puandır', () => {
    const listing = validListing();
    expect(listing.getBadges()).toEqual([]);
    expect(listing.getRankScore()).toBe(BASE_RANK_SCORE);
  });

  it('tek dekorasyon rozet ve puan ekler, veriyi korur', () => {
    const base = validListing();
    const boosted = new BoostedListing(base, { endsAt: future, clock: () => 0 });
    expect(boosted.getBadges()).toEqual(['Doping']);
    expect(boosted.getRankScore()).toBe(BASE_RANK_SCORE + DEFAULT_BOOST_POINTS);
    expect(boosted.data).toBe(base.data);
    expect(boosted.describe()).toBe(base.describe());
    expect(boosted.endsAt).toBe(future);
  });

  it('iç içe dekorasyonda rozet ve puan birikir', () => {
    const nested = new StoreBadgeListing(
      new KurbanListing(new BoostedListing(validListing(), { endsAt: future, clock: () => 0 })),
      'Konya Çiftliği',
    );
    expect(nested.getBadges()).toEqual(['Doping', 'Kurban', 'Kurumsal Mağaza: Konya Çiftliği']);
    expect(nested.getRankScore()).toBe(
      BASE_RANK_SCORE + DEFAULT_BOOST_POINTS + KURBAN_POINTS + STORE_BADGE_POINTS,
    );
  });

  it('sarma sırası fark etmez (rozet kümesi ve puan aynı)', () => {
    const boost = (l: ReturnType<typeof validListing>) =>
      new BoostedListing(l, { endsAt: future, clock: () => 0 });
    const a = new KurbanListing(new StoreBadgeListing(boost(validListing()), 'M'));
    const b = boost(new StoreBadgeListing(new KurbanListing(validListing()), 'M'));
    expect(a.getBadges().sort()).toEqual(b.getBadges().sort());
    expect(a.getRankScore()).toBe(b.getRankScore());
  });

  it('süresi dolan doping rozet ve puan vermez', () => {
    const expired = new BoostedListing(validListing(), { endsAt: new Date(1000), clock: () => 2000 });
    expect(expired.getBadges()).toEqual([]);
    expect(expired.getRankScore()).toBe(BASE_RANK_SCORE);
  });

  it('özel doping puanı kullanılabilir ve varsayılan saat Date.now’dır', () => {
    const boosted = new BoostedListing(validListing(), { endsAt: future, boostPoints: 500 });
    expect(boosted.getRankScore()).toBe(BASE_RANK_SCORE + 500);
  });
});
