import { describe, expect, it, vi } from 'vitest';
import type { AnthropicLike } from '../src/patterns/adapter/ClaudeProviderAdapter.js';
import { ClaudeProviderAdapter } from '../src/patterns/adapter/ClaudeProviderAdapter.js';
import { FakeAIProvider } from '../src/patterns/adapter/FakeAIProvider.js';
import { ModerationHandler } from '../src/patterns/chain-of-responsibility/ModerationHandler.js';
import { ModerationPipelineFactory } from '../src/patterns/factory-method/ModerationPipelineFactory.js';
import { ProductionPipelineFactory } from '../src/patterns/factory-method/ProductionPipelineFactory.js';
import { TestPipelineFactory } from '../src/patterns/factory-method/TestPipelineFactory.js';
import { CachingRateLimitedProviderProxy } from '../src/patterns/proxy/CachingRateLimitedProviderProxy.js';
import { validListing } from './helpers.js';

function neverCalledClient(): AnthropicLike {
  return { messages: { create: vi.fn().mockRejectedValue(new Error('ağ çağrısı yapılmamalı')) } };
}

describe('Factory Method: ModerationPipelineFactory', () => {
  it('TestPipelineFactory FakeAIProvider döner', () => {
    const factory = new TestPipelineFactory();
    expect(factory).toBeInstanceOf(ModerationPipelineFactory);
    expect(factory.createProvider()).toBeInstanceOf(FakeAIProvider);
  });

  it('ProductionPipelineFactory, Adapter’ı saran Proxy döner', () => {
    const factory = new ProductionPipelineFactory({ client: neverCalledClient() });
    const provider = factory.createProvider();
    expect(provider).toBeInstanceOf(CachingRateLimitedProviderProxy);
    expect((provider as CachingRateLimitedProviderProxy).inner).toBeInstanceOf(ClaudeProviderAdapter);
  });

  it('createChain() 4 handler’lı zinciri ucuzdan pahalıya kurar', async () => {
    const chain = new TestPipelineFactory().createChain();
    expect(chain).toBeInstanceOf(ModerationHandler);
    const report = await chain.handle({ listing: validListing() });
    expect(report.trail).toEqual([
      'TextPatternHandler',
      'DuplicateImageHandler',
      'TextAIHandler',
      'ImageCategoryHandler',
    ]);
  });

  it('API key yoksa varsayılan istemci açık hata verir', () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      expect(() => new ProductionPipelineFactory().createProvider()).toThrow(/ANTHROPIC_API_KEY/);
    } finally {
      if (previous !== undefined) process.env.ANTHROPIC_API_KEY = previous;
    }
  });

  it('seçenekler Proxy’ye iletilir (hız sınırı 0 → NEEDS_REVIEW, ağ yok)', async () => {
    const client = neverCalledClient();
    const factory = new ProductionPipelineFactory({ client, maxCallsPerMinute: 0, clock: () => 0 });
    const result = await factory.createProvider().analyzeText('merhaba');
    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(client.messages.create).not.toHaveBeenCalled();
  });
});
