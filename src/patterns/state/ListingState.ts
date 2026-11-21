// KALIP: State (Davranışsal) | ROL: State | Çözdüğü problem: İlanın yaşam döngüsündeki geçerli/geçersiz geçişleri durum sınıflarına dağıtarak if/else yığınını önlemek.
import type { Listing, ListingData } from '../../domain/Listing.js';
import type { ModerationResult } from '../../domain/types.js';
import type { ListingLifecycle } from './ListingLifecycle.js';

export type ListingStatus = 'DRAFT' | 'IN_MODERATION' | 'PUBLISHED' | 'SOLD' | 'EXPIRED' | 'REJECTED';

export class InvalidTransitionError extends Error {
  constructor(status: ListingStatus, action: string) {
    super(`Geçersiz geçiş: ${status} durumundaki ilanda "${action}" yapılamaz`);
    this.name = 'InvalidTransitionError';
  }
}

// GoF rolü: State (arayüz)
export interface ListingState {
  readonly status: ListingStatus;
  submit(context: ListingLifecycle): void;
  applyModeration(context: ListingLifecycle, result: ModerationResult): void;
  approveManually(context: ListingLifecycle): void;
  rejectManually(context: ListingLifecycle, reason?: string): void;
  publish(context: ListingLifecycle): void;
  markSold(context: ListingLifecycle): void;
  expire(context: ListingLifecycle): void;
  edit(context: ListingLifecycle, patch: Partial<ListingData>): void;
  decorate(context: ListingLifecycle, wrap: (listing: Listing) => Listing): void;
}

// Her işlem varsayılan olarak geçersizdir; durumlar yalnızca izin verdiklerini ezer.
export abstract class BaseListingState implements ListingState {
  abstract readonly status: ListingStatus;

  submit(_context: ListingLifecycle): void {
    throw new InvalidTransitionError(this.status, 'submit');
  }
  applyModeration(_context: ListingLifecycle, _result: ModerationResult): void {
    throw new InvalidTransitionError(this.status, 'applyModeration');
  }
  approveManually(_context: ListingLifecycle): void {
    throw new InvalidTransitionError(this.status, 'approveManually');
  }
  rejectManually(_context: ListingLifecycle, _reason?: string): void {
    throw new InvalidTransitionError(this.status, 'rejectManually');
  }
  publish(_context: ListingLifecycle): void {
    throw new InvalidTransitionError(this.status, 'publish');
  }
  markSold(_context: ListingLifecycle): void {
    throw new InvalidTransitionError(this.status, 'markSold');
  }
  expire(_context: ListingLifecycle): void {
    throw new InvalidTransitionError(this.status, 'expire');
  }
  edit(_context: ListingLifecycle, _patch: Partial<ListingData>): void {
    throw new InvalidTransitionError(this.status, 'edit');
  }
  decorate(_context: ListingLifecycle, _wrap: (listing: Listing) => Listing): void {
    throw new InvalidTransitionError(this.status, 'decorate');
  }
}
