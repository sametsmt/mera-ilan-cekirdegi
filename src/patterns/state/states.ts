// KALIP: State (Davranışsal) | ROL: ConcreteState | Çözdüğü problem: Her yaşam döngüsü durumunun yalnızca kendi geçerli geçişlerini bilmesi.
import type { Listing, ListingData } from '../../domain/Listing.js';
import { LivestockListing } from '../builder/LivestockListing.js';
import type { ModerationResult } from '../../domain/types.js';
import type { ListingLifecycle } from './ListingLifecycle.js';
import { BaseListingState, type ListingStatus } from './ListingState.js';

// GoF rolü: ConcreteState (Taslak)
export class DraftState extends BaseListingState {
  readonly status: ListingStatus = 'DRAFT';

  override submit(context: ListingLifecycle): void {
    context.setState(new InModerationState());
  }

  override edit(context: ListingLifecycle, patch: Partial<ListingData>): void {
    context.replaceListing(new LivestockListing({ ...context.listing.data, ...patch }));
  }
}

// GoF rolü: ConcreteState (Moderasyonda)
export class InModerationState extends BaseListingState {
  readonly status: ListingStatus = 'IN_MODERATION';

  override applyModeration(context: ListingLifecycle, result: ModerationResult): void {
    context.lastModeration = result;
    if (result.verdict === 'APPROVED') {
      context.setState(new PublishedState());
    } else if (result.verdict === 'REJECTED') {
      context.rejectionReason = result.reasons.join('; ');
      context.setState(new RejectedState());
    }
    // NEEDS_REVIEW: durum değişmez, manuel inceleme beklenir.
  }

  override approveManually(context: ListingLifecycle): void {
    context.setState(new PublishedState());
  }

  override rejectManually(context: ListingLifecycle, reason?: string): void {
    context.rejectionReason = reason ?? 'Manuel incelemede reddedildi';
    context.setState(new RejectedState());
  }

  // Manuel yayınlama, manuel onayla aynı yolu izler.
  override publish(context: ListingLifecycle): void {
    this.approveManually(context);
  }
}

// GoF rolü: ConcreteState (Yayında)
export class PublishedState extends BaseListingState {
  readonly status: ListingStatus = 'PUBLISHED';

  override markSold(context: ListingLifecycle): void {
    context.setState(new SoldState());
  }

  override expire(context: ListingLifecycle): void {
    context.setState(new ExpiredState());
  }

  override decorate(context: ListingLifecycle, wrap: (listing: Listing) => Listing): void {
    context.replaceListing(wrap(context.listing));
  }
}

// GoF rolü: ConcreteState (Satıldı, son durum)
export class SoldState extends BaseListingState {
  readonly status: ListingStatus = 'SOLD';
}

// GoF rolü: ConcreteState (Süresi doldu, son durum)
export class ExpiredState extends BaseListingState {
  readonly status: ListingStatus = 'EXPIRED';
}

// GoF rolü: ConcreteState (Reddedildi, son durum)
export class RejectedState extends BaseListingState {
  readonly status: ListingStatus = 'REJECTED';
}
