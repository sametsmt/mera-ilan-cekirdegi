// KALIP: State (Davranışsal) | ROL: Context | Çözdüğü problem: İlanın mevcut durumunu tutup tüm işlemleri o duruma devretmek.
import type { Listing, ListingData } from '../../domain/Listing.js';
import type { ModerationResult } from '../../domain/types.js';
import { DraftState } from './states.js';
import type { ListingState, ListingStatus } from './ListingState.js';

// GoF rolü: Context
export class ListingLifecycle {
  private state: ListingState = new DraftState();
  private currentListing: Listing;
  private readonly history: ListingStatus[] = ['DRAFT'];
  lastModeration?: ModerationResult;
  rejectionReason?: string;

  constructor(listing: Listing) {
    this.currentListing = listing;
  }

  get listing(): Listing {
    return this.currentListing;
  }

  get status(): ListingStatus {
    return this.state.status;
  }

  get transitions(): readonly ListingStatus[] {
    return this.history;
  }

  // Durum sınıfları tarafından çağrılır.
  setState(state: ListingState): void {
    this.state = state;
    this.history.push(state.status);
  }

  replaceListing(listing: Listing): void {
    this.currentListing = listing;
  }

  submit(): void {
    this.state.submit(this);
  }
  applyModeration(result: ModerationResult): void {
    this.state.applyModeration(this, result);
  }
  approveManually(): void {
    this.state.approveManually(this);
  }
  rejectManually(reason?: string): void {
    this.state.rejectManually(this, reason);
  }
  publish(): void {
    this.state.publish(this);
  }
  markSold(): void {
    this.state.markSold(this);
  }
  expire(): void {
    this.state.expire(this);
  }
  edit(patch: Partial<ListingData>): void {
    this.state.edit(this, patch);
  }
  decorate(wrap: (listing: Listing) => Listing): void {
    this.state.decorate(this, wrap);
  }
}
