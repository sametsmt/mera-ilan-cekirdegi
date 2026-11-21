// Akış: Builder ile ilan kur → Lifecycle ile submit et → Factory'nin zincirini çalıştır → verdict'e göre state geçişi → (opsiyonel) Decorator.
import type { Listing } from '../domain/Listing.js';
import type { ModerationReport } from '../domain/moderation.js';
import type { ListingBuilder } from '../patterns/builder/ListingBuilder.js';
import { LivestockListingBuilder } from '../patterns/builder/LivestockListingBuilder.js';
import type { ModerationHandler } from '../patterns/chain-of-responsibility/ModerationHandler.js';
import type { ModerationPipelineFactory } from '../patterns/factory-method/ModerationPipelineFactory.js';
import { ListingLifecycle } from '../patterns/state/ListingLifecycle.js';

export interface SubmitOptions {
  // Yalnızca ilan yayına çıkarsa uygulanır.
  decorate?: (listing: Listing) => Listing;
}

export interface SubmitOutcome {
  lifecycle: ListingLifecycle;
  report: ModerationReport;
}

export class ListingService {
  private readonly chain: ModerationHandler;

  constructor(factory: ModerationPipelineFactory) {
    this.chain = factory.createChain();
  }

  buildListing(configure: (builder: ListingBuilder) => ListingBuilder): Listing {
    return configure(new LivestockListingBuilder()).build();
  }

  async submit(listing: Listing, options: SubmitOptions = {}): Promise<SubmitOutcome> {
    const lifecycle = new ListingLifecycle(listing);
    lifecycle.submit();
    const report = await this.chain.handle({ listing });
    lifecycle.applyModeration(report);
    if (lifecycle.status === 'PUBLISHED' && options.decorate) {
      lifecycle.decorate(options.decorate);
    }
    return { lifecycle, report };
  }

  async createAndSubmit(
    configure: (builder: ListingBuilder) => ListingBuilder,
    options: SubmitOptions = {},
  ): Promise<SubmitOutcome> {
    return this.submit(this.buildListing(configure), options);
  }
}
