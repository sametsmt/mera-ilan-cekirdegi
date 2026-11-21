import { describe, expect, it } from 'vitest';
import { BoostedListing } from '../src/patterns/decorator/BoostedListing.js';
import { StoreBadgeListing } from '../src/patterns/decorator/StoreBadgeListing.js';
import { TestPipelineFactory } from '../src/patterns/factory-method/TestPipelineFactory.js';
import { ListingService } from '../src/services/ListingService.js';
import { photo } from './helpers.js';

function setup() {
  const factory = new TestPipelineFactory();
  return { fake: factory.fake, service: new ListingService(factory) };
}

describe('Entegrasyon: ListingService', () => {
  it('temiz ilan → Published, dekorasyon uygulanır', async () => {
    const { service } = setup();
    const { lifecycle, report } = await service.createAndSubmit(
      (b) =>
        b
          .setTitle('Holstein inek')
          .setCategory('BUYUKBAS')
          .setSpecies('cattle')
          .setSex('female')
          .setMilkYield(28)
          .setPrice(95000)
          .setProvince('Konya')
          .addPhoto(photo('cow-1')),
      {
        decorate: (l) =>
          new StoreBadgeListing(new BoostedListing(l, { endsAt: new Date(2100, 0, 1) }), 'Çiftlik'),
      },
    );
    expect(report.verdict).toBe('APPROVED');
    expect(lifecycle.status).toBe('PUBLISHED');
    expect(lifecycle.listing.getBadges()).toEqual(['Doping', 'Kurumsal Mağaza: Çiftlik']);
    expect(lifecycle.listing.getRankScore()).toBe(170);
  });

  it('dolandırıcı ilan → Rejected, AI hiç çağrılmaz, dekorasyon uygulanmaz', async () => {
    const { service, fake } = setup();
    const { lifecycle, report } = await service.createAndSubmit(
      (b) =>
        b
          .setTitle('Acil koyun')
          .setDescription('Kapora için IBAN TR33 0006 1005 1978 6457 8413 26')
          .setCategory('KUCUKBAS')
          .setSpecies('sheep')
          .setPrice(8000)
          .setProvince('Ankara')
          .addPhoto(photo('sheep-1')),
      { decorate: (l) => new StoreBadgeListing(l, 'X') },
    );
    expect(report.verdict).toBe('REJECTED');
    expect(lifecycle.status).toBe('REJECTED');
    expect(lifecycle.rejectionReason).toContain('IBAN');
    expect(lifecycle.listing.getBadges()).toEqual([]);
    expect(fake.totalCalls).toBe(0);
  });

  it('belirsiz ilan → InModeration; manuel onayla yayına çıkar', async () => {
    const { service } = setup();
    const { lifecycle, report } = await service.createAndSubmit((b) =>
      b
        .setTitle('Keçi sürüsü')
        .setCategory('KUCUKBAS')
        .setSpecies('goat')
        .setPrice(40000)
        .setProvince('İzmir')
        .addPhoto(photo('blurry-goat')),
    );
    expect(report.verdict).toBe('NEEDS_REVIEW');
    expect(lifecycle.status).toBe('IN_MODERATION');
    lifecycle.approveManually();
    expect(lifecycle.status).toBe('PUBLISHED');
  });

  it('geçersiz ilan Builder aşamasında hata verir, zincire girmez', async () => {
    const { service, fake } = setup();
    await expect(service.createAndSubmit((b) => b.setTitle('eksik'))).rejects.toThrow(/Geçersiz ilan/);
    expect(fake.totalCalls).toBe(0);
  });
});
