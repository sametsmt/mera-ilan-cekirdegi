import { describe, expect, it } from 'vitest';
import type { ModerationResult } from '../src/domain/types.js';
import { KurbanListing } from '../src/patterns/decorator/KurbanListing.js';
import { ListingLifecycle } from '../src/patterns/state/ListingLifecycle.js';
import { InvalidTransitionError } from '../src/patterns/state/ListingState.js';
import { validListing } from './helpers.js';

const approved: ModerationResult = { verdict: 'APPROVED', reasons: [] };
const rejected: ModerationResult = { verdict: 'REJECTED', reasons: ['IBAN var'] };
const unsure: ModerationResult = { verdict: 'NEEDS_REVIEW', reasons: ['belirsiz'] };

function inModeration() {
  const lifecycle = new ListingLifecycle(validListing());
  lifecycle.submit();
  return lifecycle;
}

describe('State: ListingLifecycle', () => {
  it('Draft → submit → InModeration', () => {
    const lifecycle = new ListingLifecycle(validListing());
    expect(lifecycle.status).toBe('DRAFT');
    lifecycle.submit();
    expect(lifecycle.status).toBe('IN_MODERATION');
  });

  it('APPROVED → Published, REJECTED → Rejected', () => {
    const ok = inModeration();
    ok.applyModeration(approved);
    expect(ok.status).toBe('PUBLISHED');

    const bad = inModeration();
    bad.applyModeration(rejected);
    expect(bad.status).toBe('REJECTED');
    expect(bad.rejectionReason).toBe('IBAN var');
  });

  it('NEEDS_REVIEW InModeration’da kalır; manuel onay yayınlar', () => {
    const lifecycle = inModeration();
    lifecycle.applyModeration(unsure);
    expect(lifecycle.status).toBe('IN_MODERATION');
    expect(lifecycle.lastModeration).toEqual(unsure);
    lifecycle.approveManually();
    expect(lifecycle.status).toBe('PUBLISHED');
  });

  it('manuel red Rejected’a götürür; neden verilmezse varsayılan yazılır', () => {
    const withReason = inModeration();
    withReason.rejectManually('sahte ilan');
    expect(withReason.status).toBe('REJECTED');
    expect(withReason.rejectionReason).toBe('sahte ilan');

    const without = inModeration();
    without.rejectManually();
    expect(without.rejectionReason).toMatch(/Manuel/);
  });

  it('Published → markSold → Sold ve Published → expire → Expired', () => {
    const sold = inModeration();
    sold.applyModeration(approved);
    sold.markSold();
    expect(sold.status).toBe('SOLD');

    const expired = inModeration();
    expired.applyModeration(approved);
    expired.expire();
    expect(expired.status).toBe('EXPIRED');
    expect(expired.transitions).toEqual(['DRAFT', 'IN_MODERATION', 'PUBLISHED', 'EXPIRED']);
  });

  it('reddedilen ilan yayına giremez', () => {
    const lifecycle = inModeration();
    lifecycle.applyModeration(rejected);
    expect(() => lifecycle.publish()).toThrow(InvalidTransitionError);
    expect(() => lifecycle.approveManually()).toThrow(/REJECTED/);
    expect(lifecycle.status).toBe('REJECTED');
  });

  it('satılmış ilan düzenlenemez, yeniden satılamaz', () => {
    const lifecycle = inModeration();
    lifecycle.applyModeration(approved);
    lifecycle.markSold();
    expect(() => lifecycle.edit({ title: 'yeni' })).toThrow(/SOLD.*edit/);
    expect(() => lifecycle.markSold()).toThrow(InvalidTransitionError);
    expect(() => lifecycle.expire()).toThrow(InvalidTransitionError);
  });

  it('taslakta submit dışındaki işlemler geçersizdir', () => {
    const lifecycle = new ListingLifecycle(validListing());
    expect(() => lifecycle.publish()).toThrow(InvalidTransitionError);
    expect(() => lifecycle.applyModeration(approved)).toThrow(InvalidTransitionError);
    expect(() => lifecycle.approveManually()).toThrow(InvalidTransitionError);
    expect(() => lifecycle.rejectManually()).toThrow(InvalidTransitionError);
    expect(() => lifecycle.markSold()).toThrow(InvalidTransitionError);
    expect(() => lifecycle.expire()).toThrow(InvalidTransitionError);
    expect(() => lifecycle.decorate((l) => l)).toThrow(InvalidTransitionError);
  });

  it('moderasyondayken tekrar submit edilemez', () => {
    expect(() => inModeration().submit()).toThrow(/IN_MODERATION/);
  });

  it('InModeration’da publish manuel onayla aynıdır', () => {
    const lifecycle = inModeration();
    lifecycle.publish();
    expect(lifecycle.status).toBe('PUBLISHED');
  });

  it('taslakta düzenleme veriyi günceller, yayındaki ilan düzenlenemez', () => {
    const lifecycle = new ListingLifecycle(validListing());
    lifecycle.edit({ title: 'Yeni başlık', price: 1 });
    expect(lifecycle.listing.data.title).toBe('Yeni başlık');
    lifecycle.submit();
    lifecycle.applyModeration(approved);
    expect(() => lifecycle.edit({ title: 'x' })).toThrow(InvalidTransitionError);
  });

  it('yalnızca yayındaki ilan dekore edilebilir', () => {
    const lifecycle = inModeration();
    expect(() => lifecycle.decorate((l) => new KurbanListing(l))).toThrow(InvalidTransitionError);
    lifecycle.applyModeration(approved);
    lifecycle.decorate((l) => new KurbanListing(l));
    expect(lifecycle.listing.getBadges()).toEqual(['Kurban']);
  });
});
