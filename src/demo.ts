// Demo: `npm run demo`. Varsayılan sahte sağlayıcı; USE_REAL_AI=true ve ANTHROPIC_API_KEY ile gerçek Claude.
import type { ImageInput } from './domain/types.js';
import { FakeAIProvider } from './patterns/adapter/FakeAIProvider.js';
import { BoostedListing } from './patterns/decorator/BoostedListing.js';
import { KurbanListing } from './patterns/decorator/KurbanListing.js';
import { StoreBadgeListing } from './patterns/decorator/StoreBadgeListing.js';
import type { ModerationPipelineFactory } from './patterns/factory-method/ModerationPipelineFactory.js';
import { ProductionPipelineFactory } from './patterns/factory-method/ProductionPipelineFactory.js';
import { TestPipelineFactory } from './patterns/factory-method/TestPipelineFactory.js';
import { ListingService, type SubmitOutcome } from './services/ListingService.js';

try {
  process.loadEnvFile();
} catch {
  // .env opsiyonel
}

function photo(id: string, content: string): ImageInput {
  return { id, url: `https://ornek.test/${id}.jpg`, bytes: Buffer.from(content) };
}

function show(title: string, outcome: SubmitOutcome): void {
  const { lifecycle, report } = outcome;
  console.log(`\n=== ${title} ===`);
  console.log(`İlan        : ${lifecycle.listing.describe()}`);
  console.log(`Çalışan zincir: ${report.trail.join(' → ')}`);
  console.log(`Verdict     : ${report.verdict}`);
  console.log(`Nedenler    : ${report.reasons.length > 0 ? report.reasons.join('; ') : '-'}`);
  console.log(`Durum geçişi: ${lifecycle.transitions.join(' → ')}`);
  console.log(`Rozetler    : ${lifecycle.listing.getBadges().join(', ') || '-'} | Sıralama puanı: ${lifecycle.listing.getRankScore()}`);
}

async function main(): Promise<void> {
  const useRealAI = process.env.USE_REAL_AI === 'true' && !!process.env.ANTHROPIC_API_KEY;
  let factory: ModerationPipelineFactory;
  let fake: FakeAIProvider | undefined;
  if (useRealAI) {
    factory = new ProductionPipelineFactory();
    console.log('Mod: GERÇEK AI (Proxy + Adapter)');
  } else {
    const testFactory = new TestPipelineFactory();
    fake = testFactory.fake;
    factory = testFactory;
    console.log('Mod: SAHTE AI (TestPipelineFactory)');
  }
  const service = new ListingService(factory);

  const clean = await service.createAndSubmit(
    (b) =>
      b
        .setTitle('Süt verimi yüksek Holstein inek')
        .setDescription('Sağlıklı, aşıları tam.')
        .setCategory('BUYUKBAS')
        .setSpecies('cattle')
        .setSex('female')
        .setMilkYield(28)
        .setEarTagNo('TR0011223344')
        .setPrice(95000)
        .setProvince('Konya')
        .addPhoto(photo('cow-1', 'temiz-ilan-foto-1')),
    {
      decorate: (l) =>
        new StoreBadgeListing(
          new BoostedListing(new KurbanListing(l), { endsAt: new Date(Date.now() + 7 * 86_400_000) }),
          'Konya Çiftliği',
        ),
    },
  );
  show('Senaryo 1: Temiz ilan', clean);

  const scam = await service.createAndSubmit((b) =>
    b
      .setTitle('Acil koyun satılık')
      .setDescription('Kapora için IBAN: TR33 0006 1005 1978 6457 8413 26, WhatsApp yazın.')
      .setCategory('KUCUKBAS')
      .setSpecies('sheep')
      .setPrice(8000)
      .setProvince('Ankara')
      .addPhoto(photo('sheep-1', 'dolandirici-foto-1')),
  );
  show('Senaryo 2: Dolandırıcı ilan', scam);

  const unsure = await service.createAndSubmit((b) =>
    b
      .setTitle('Keçi sürüsü')
      .setCategory('KUCUKBAS')
      .setSpecies('goat')
      .setPrice(40000)
      .setProvince('İzmir')
      .addPhoto(photo('blurry-goat', 'belirsiz-foto-1')),
  );
  show('Senaryo 3: Belirsiz ilan (manuel inceleme)', unsure);

  if (fake) console.log(`\nSahte AI toplam çağrı: ${fake.totalCalls} (metin ${fake.textCalls}, görsel ${fake.imageCalls})`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
