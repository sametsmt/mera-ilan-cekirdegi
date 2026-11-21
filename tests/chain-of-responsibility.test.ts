import { describe, expect, it } from 'vitest';
import { mergeResults, worstVerdict } from '../src/domain/moderation.js';
import { DuplicateImageHandler } from '../src/patterns/chain-of-responsibility/DuplicateImageHandler.js';
import { InMemoryImageHashStore } from '../src/patterns/chain-of-responsibility/ImageHashStore.js';
import { TestPipelineFactory } from '../src/patterns/factory-method/TestPipelineFactory.js';
import { LivestockListingBuilder } from '../src/patterns/builder/LivestockListingBuilder.js';
import { photo, validBuilder } from './helpers.js';

function setup() {
  const factory = new TestPipelineFactory();
  return { fake: factory.fake, chain: factory.createChain() };
}

describe('Chain of Responsibility: ModerationHandler', () => {
  it('IBAN’lı metinde REJECTED olur ve AI çağrı sayısı 0 kalır', async () => {
    const { fake, chain } = setup();
    const listing = validBuilder().setDescription('IBAN: TR33 0006 1005 1978 6457 8413 26').build();
    const report = await chain.handle({ listing });
    expect(report.verdict).toBe('REJECTED');
    expect(report.reasons).toContain('Metinde IBAN var');
    expect(report.trail).toEqual(['TextPatternHandler']);
    expect(fake.totalCalls).toBe(0);
  });

  it('uygulama dışına yönlendirme REJECTED olur, kapora tek başına NEEDS_REVIEW olur', async () => {
    for (const text of ['WhatsApp’tan yazın', 'Telegram: @satici', 'Ara: 0532 123 45 67']) {
      const { fake, chain } = setup();
      const report = await chain.handle({ listing: validBuilder().setDescription(text).build() });
      expect(report.verdict).toBe('REJECTED');
      expect(fake.totalCalls).toBe(0);
    }
    const { chain } = setup();
    const report = await chain.handle({ listing: validBuilder().setDescription('Kapora alınır').build() });
    expect(report.verdict).toBe('NEEDS_REVIEW');
    expect(report.trail).toHaveLength(4);
  });

  it('kopya fotoğrafta REJECTED olur ve AI çağrılmaz', async () => {
    const { fake, chain } = setup();
    const shared = photo('cow-1', 'ayni-bayt');
    const first = validBuilder().addPhoto(shared).build();
    const second = new LivestockListingBuilder()
      .setTitle('Başka ilan')
      .setCategory('BUYUKBAS')
      .setSpecies('cattle')
      .setPrice(1)
      .setProvince('Ordu')
      .addPhoto(shared)
      .build();

    expect((await chain.handle({ listing: first })).verdict).toBe('APPROVED');
    const callsAfterFirst = fake.totalCalls;
    const report = await chain.handle({ listing: second });
    expect(report.verdict).toBe('REJECTED');
    expect(report.trail).toEqual(['TextPatternHandler', 'DuplicateImageHandler']);
    expect(fake.totalCalls).toBe(callsAfterFirst);
  });

  it('temiz ilanda tüm handler’lar sırayla çalışır', async () => {
    const { fake, chain } = setup();
    const report = await chain.handle({ listing: validBuilder().build() });
    expect(report.verdict).toBe('APPROVED');
    expect(report.reasons).toEqual([]);
    expect(report.detectedSpecies).toBe('cattle');
    expect(report.trail).toEqual([
      'TextPatternHandler',
      'DuplicateImageHandler',
      'TextAIHandler',
      'ImageCategoryHandler',
    ]);
    expect(fake.textCalls).toBe(1);
    expect(fake.imageCalls).toBe(1);
  });

  it('NEEDS_REVIEW sonuçları birleşir: en kötü verdict ve tüm nedenler', async () => {
    const { chain } = setup();
    const listing = validBuilder()
      .setDescription('Kapora alınır, belki pazarlık olur')
      .addPhoto(photo('blurry-cow'))
      .build();
    const report = await chain.handle({ listing });
    expect(report.verdict).toBe('NEEDS_REVIEW');
    expect(report.reasons).toEqual(
      expect.arrayContaining(['Metinde "kapora" ifadesi var', 'Metin şüpheli bulundu', 'Görsel net değil']),
    );
  });

  it('görselde hayvan yoksa REJECTED olur', async () => {
    const { chain } = setup();
    const listing = validBuilder().addPhoto(photo('tractor-1')).build();
    const report = await chain.handle({ listing });
    expect(report.verdict).toBe('REJECTED');
    expect(report.reasons).toContain('Görselde hayvan yok');
  });

  it('görsel türü ilan türüyle uyuşmazsa REJECTED olur', async () => {
    const { chain } = setup();
    const listing = new LivestockListingBuilder()
      .setTitle('Koyun')
      .setCategory('KUCUKBAS')
      .setSpecies('sheep')
      .setPrice(5000)
      .setProvince('Van')
      .addPhoto(photo('cow-9'))
      .build();
    const report = await chain.handle({ listing });
    expect(report.verdict).toBe('REJECTED');
    expect(report.reasons[0]).toMatch(/uyuşmuyor/);
  });

  it('tür belirlenemeyen görselde NEEDS_REVIEW olur', async () => {
    const { chain } = setup();
    const report = await chain.handle({ listing: validBuilder().addPhoto(photo('xyz')).build() });
    expect(report.verdict).toBe('NEEDS_REVIEW');
  });

  it('DuplicateImageHandler kendi içinde tekrar eden fotoğrafı da yakalar', async () => {
    const handler = new DuplicateImageHandler(new InMemoryImageHashStore());
    const dup = photo('cow-1', 'x');
    const listing = validBuilder().addPhoto(dup).build();
    // ilk geçiş depoyu doldurur, aynı ilanın ikinci geçişi kopya sayılır
    expect((await handler.handle({ listing })).verdict).toBe('APPROVED');
    expect((await handler.handle({ listing })).verdict).toBe('REJECTED');
  });

  it('birleştirme yardımcıları en kötü verdict’i seçer', () => {
    expect(worstVerdict('APPROVED', 'NEEDS_REVIEW')).toBe('NEEDS_REVIEW');
    expect(worstVerdict('REJECTED', 'NEEDS_REVIEW')).toBe('REJECTED');
    const merged = mergeResults(
      { verdict: 'APPROVED', reasons: ['a'] },
      { verdict: 'NEEDS_REVIEW', reasons: ['a', 'b'], detectedSpecies: 'goat' },
    );
    expect(merged).toEqual({ verdict: 'NEEDS_REVIEW', reasons: ['a', 'b'], detectedSpecies: 'goat' });
  });
});
