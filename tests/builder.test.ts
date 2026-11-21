import { describe, expect, it } from 'vitest';
import {
  ListingValidationError,
  LivestockListingBuilder,
} from '../src/patterns/builder/LivestockListingBuilder.js';
import { photo, validBuilder } from './helpers.js';

describe('Builder: LivestockListingBuilder', () => {
  it('geçerli ilanı kurar ve opsiyonel alanları taşır', () => {
    const listing = validBuilder()
      .setMilkYield(25)
      .setPregnant(true)
      .setBirthCount(2)
      .setEarTagNo('TR001')
      .setVideoUrl('https://ornek.test/v.mp4')
      .build();
    expect(listing.data.title).toBe('Süt verimli inek');
    expect(listing.data.milkYieldLiters).toBe(25);
    expect(listing.data.earTagNo).toBe('TR001');
    expect(listing.data.photos).toHaveLength(1);
  });

  it('eksik zorunlu alanların hepsini raporlar', () => {
    const attempt = () => new LivestockListingBuilder().build();
    expect(attempt).toThrow(ListingValidationError);
    try {
      attempt();
    } catch (error) {
      const problems = (error as ListingValidationError).problems;
      expect(problems).toHaveLength(6);
    }
  });

  it('fotoğrafsız ilanı reddeder', () => {
    const builder = new LivestockListingBuilder()
      .setTitle('x')
      .setCategory('KANATLI')
      .setSpecies('chicken')
      .setPrice(10)
      .setProvince('Bursa');
    expect(() => builder.build()).toThrow(/fotoğraf/);
  });

  it('süt verimini erkek hayvanda reddeder', () => {
    const builder = validBuilder().setSex('male').setMilkYield(10);
    expect(() => builder.build()).toThrow(/süt verimi/);
  });

  it('süt verimini kanatlıda reddeder', () => {
    const builder = new LivestockListingBuilder()
      .setTitle('Tavuk')
      .setCategory('KANATLI')
      .setSpecies('chicken')
      .setSex('female')
      .setMilkYield(1)
      .setPrice(100)
      .setProvince('Bursa')
      .addPhoto(photo('chicken-1'));
    expect(() => builder.build()).toThrow(ListingValidationError);
  });

  it('tür kategoriyle uyuşmazsa hata verir', () => {
    const builder = validBuilder().setSpecies('chicken');
    expect(() => builder.build()).toThrow(/kategorisine ait değil/);
  });

  it('küpe no ve gebelik kurallarını kategoriye göre doğrular', () => {
    const poultry = new LivestockListingBuilder()
      .setTitle('Hindi')
      .setCategory('KANATLI')
      .setSpecies('turkey')
      .setPrice(100)
      .setProvince('Bolu')
      .addPhoto(photo('turkey-1'));
    expect(() => poultry.setEarTagNo('TR1').build()).toThrow(/küpe/);
    expect(() => validBuilder().setSex('male').setPregnant(true).build()).toThrow(/gebelik/);
  });

  it('negatif süt verimini reddeder', () => {
    expect(() => validBuilder().setMilkYield(-1).build()).toThrow(/negatif/);
  });
});
