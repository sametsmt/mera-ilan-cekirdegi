// KALIP: Factory Method (Yaratımsal) | ROL: ConcreteCreator | Çözdüğü problem: Üretimde Claude'u Adapter ile uyarlayıp Proxy ile önbellek ve hız sınırı arkasına almak.
import Anthropic from '@anthropic-ai/sdk';
import type { Clock } from '../../domain/types.js';
import type { AIModelProvider } from '../adapter/AIModelProvider.js';
import { ClaudeProviderAdapter, type AnthropicLike } from '../adapter/ClaudeProviderAdapter.js';
import type { ImageHashStore } from '../chain-of-responsibility/ImageHashStore.js';
import { CachingRateLimitedProviderProxy } from '../proxy/CachingRateLimitedProviderProxy.js';
import { ModerationPipelineFactory } from './ModerationPipelineFactory.js';

export interface ProductionPipelineOptions {
  client?: AnthropicLike;
  model?: string;
  maxCallsPerMinute?: number;
  clock?: Clock;
  hashStore?: ImageHashStore;
}

// GoF rolü: ConcreteCreator (ConcreteProduct: CachingRateLimitedProviderProxy(ClaudeProviderAdapter))
export class ProductionPipelineFactory extends ModerationPipelineFactory {
  constructor(private readonly options: ProductionPipelineOptions = {}) {
    super(options.hashStore);
  }

  createProvider(): AIModelProvider {
    const adapter = new ClaudeProviderAdapter(this.options.client ?? defaultClient(), this.options.model);
    return new CachingRateLimitedProviderProxy(adapter, {
      ...(this.options.maxCallsPerMinute !== undefined && { maxCallsPerMinute: this.options.maxCallsPerMinute }),
      ...(this.options.clock !== undefined && { clock: this.options.clock }),
    });
  }
}

function defaultClient(): AnthropicLike {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY tanımlı değil (.env dosyasını kontrol edin)');
  return new Anthropic({ apiKey }) as unknown as AnthropicLike;
}
