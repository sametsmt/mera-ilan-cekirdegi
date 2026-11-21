// KALIP: Proxy (Yapısal) | ROL: Proxy | Çözdüğü problem: Pahalı AI çağrılarını önbellekleyip dakikadaki çağrı sayısını sınırlayarak maliyeti kontrol etmek.
import { createHash } from 'node:crypto';
import type { Clock, ImageInput, ModerationResult } from '../../domain/types.js';
import type { AIModelProvider } from '../adapter/AIModelProvider.js';

export interface ProxyOptions {
  maxCallsPerMinute?: number;
  clock?: Clock;
}

const WINDOW_MS = 60_000;

// GoF rolü: Proxy (RealSubject: içindeki AIModelProvider)
export class CachingRateLimitedProviderProxy implements AIModelProvider {
  private readonly cache = new Map<string, ModerationResult>();
  private callTimes: number[] = [];
  private readonly maxCallsPerMinute: number;
  private readonly clock: Clock;

  constructor(
    private readonly subject: AIModelProvider,
    options: ProxyOptions = {},
  ) {
    this.maxCallsPerMinute = options.maxCallsPerMinute ?? 10;
    this.clock = options.clock ?? Date.now;
  }

  get inner(): AIModelProvider {
    return this.subject;
  }

  analyzeText(text: string): Promise<ModerationResult> {
    return this.guarded(`text:${sha256(text)}`, () => this.subject.analyzeText(text));
  }

  analyzeImage(image: ImageInput): Promise<ModerationResult> {
    return this.guarded(`image:${sha256(image.bytes)}`, () => this.subject.analyzeImage(image));
  }

  private async guarded(
    key: string,
    call: () => Promise<ModerationResult>,
  ): Promise<ModerationResult> {
    const cached = this.cache.get(key);
    if (cached) return cached;

    const now = this.clock();
    this.callTimes = this.callTimes.filter((t) => now - t < WINDOW_MS);
    if (this.callTimes.length >= this.maxCallsPerMinute) {
      return {
        verdict: 'NEEDS_REVIEW',
        reasons: ['Yapay zekâ çağrı sınırı aşıldı; manuel inceleme gerekli'],
      };
    }
    this.callTimes.push(now);

    const result = await call();
    // Belirsiz sonuç geçici hatadan gelmiş olabilir; önbelleğe alınmaz.
    if (result.verdict !== 'NEEDS_REVIEW') this.cache.set(key, result);
    return result;
  }
}

function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}
