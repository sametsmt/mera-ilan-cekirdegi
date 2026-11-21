// KALIP: Chain of Responsibility (Davranışsal) | ROL: Handler | Çözdüğü problem: Moderasyon kontrollerini ucuzdan pahalıya sıralayıp kesin redde pahalı AI adımlarını atlamak.
import type { Listing } from '../../domain/Listing.js';
import { mergeResults, type ModerationReport } from '../../domain/moderation.js';
import type { ModerationResult } from '../../domain/types.js';

export interface ModerationContext {
  listing: Listing;
}

// GoF rolü: Handler (soyut; zinciri yürütme mantığı burada, kontrol check() içinde)
export abstract class ModerationHandler {
  private next?: ModerationHandler;

  get name(): string {
    return this.constructor.name;
  }

  setNext(handler: ModerationHandler): ModerationHandler {
    this.next = handler;
    return handler;
  }

  async handle(context: ModerationContext): Promise<ModerationReport> {
    const own = await this.check(context);
    const ownReport: ModerationReport = { ...own, trail: [this.name] };
    // REJECTED zinciri durdurur; sonraki (pahalı) adımlar çağrılmaz.
    if (own.verdict === 'REJECTED' || !this.next) return ownReport;

    const rest = await this.next.handle(context);
    return { ...mergeResults(own, rest), trail: [this.name, ...rest.trail] };
  }

  protected abstract check(context: ModerationContext): Promise<ModerationResult>;
}
