import { describe, expect, it } from 'vitest';
import { FakeAIProvider } from '../src/patterns/adapter/FakeAIProvider.js';
import { CachingRateLimitedProviderProxy } from '../src/patterns/proxy/CachingRateLimitedProviderProxy.js';
import { photo } from './helpers.js';

function setup(maxCallsPerMinute = 3) {
  const fake = new FakeAIProvider();
  const time = { now: 0 };
  const proxy = new CachingRateLimitedProviderProxy(fake, { maxCallsPerMinute, clock: () => time.now });
  return { fake, time, proxy };
}

describe('Proxy: CachingRateLimitedProviderProxy', () => {
  it('aynı metin için iç sağlayıcıyı 1 kez çağırır', async () => {
    const { fake, proxy } = setup();
    const a = await proxy.analyzeText('aynı metin');
    const b = await proxy.analyzeText('aynı metin');
    expect(b).toEqual(a);
    expect(fake.textCalls).toBe(1);
  });

  it('aynı görsel baytları için iç sağlayıcıyı 1 kez çağırır', async () => {
    const { fake, proxy } = setup();
    const image = photo('cow-1', 'sabit-bayt');
    await proxy.analyzeImage(image);
    await proxy.analyzeImage({ ...image, id: 'baska-ad' });
    expect(fake.imageCalls).toBe(1);
  });

  it('dakikalık sınır aşılınca NEEDS_REVIEW döner ve iç sağlayıcı çağrılmaz', async () => {
    const { fake, proxy } = setup(2);
    await proxy.analyzeText('bir');
    await proxy.analyzeText('iki');
    const limited = await proxy.analyzeText('üç');
    expect(limited.verdict).toBe('NEEDS_REVIEW');
    expect(limited.reasons[0]).toMatch(/sınırı/);
    expect(fake.textCalls).toBe(2);
  });

  it('zaman ilerleyince limit sıfırlanır', async () => {
    const { fake, time, proxy } = setup(1);
    await proxy.analyzeText('bir');
    expect((await proxy.analyzeText('iki')).verdict).toBe('NEEDS_REVIEW');
    time.now = 60_001;
    expect((await proxy.analyzeText('iki')).verdict).toBe('APPROVED');
    expect(fake.textCalls).toBe(2);
  });

  it('önbellekten dönen cevap limite sayılmaz', async () => {
    const { proxy } = setup(1);
    await proxy.analyzeText('bir');
    for (let i = 0; i < 5; i++) {
      expect((await proxy.analyzeText('bir')).verdict).toBe('APPROVED');
    }
  });

  it('NEEDS_REVIEW sonuçlarını önbelleğe almaz', async () => {
    const { fake, proxy } = setup();
    await proxy.analyzeText('belki');
    await proxy.analyzeText('belki');
    expect(fake.textCalls).toBe(2);
  });

  it('varsayılan ayarlarla (10/dk, Date.now) çalışır', async () => {
    const fake = new FakeAIProvider();
    const proxy = new CachingRateLimitedProviderProxy(fake);
    expect((await proxy.analyzeText('merhaba')).verdict).toBe('APPROVED');
    expect(proxy.inner).toBe(fake);
  });
});
