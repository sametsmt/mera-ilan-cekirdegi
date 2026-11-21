// KALIP: Chain of Responsibility (Davranışsal) | ROL: ConcreteHandler | Çözdüğü problem: Başka ilandan kopyalanmış fotoğrafı AI'a gitmeden hash ile yakalamak.
import { createHash } from 'node:crypto';
import type { ModerationResult } from '../../domain/types.js';
import type { ImageHashStore } from './ImageHashStore.js';
import { ModerationHandler, type ModerationContext } from './ModerationHandler.js';

// GoF rolü: ConcreteHandler
export class DuplicateImageHandler extends ModerationHandler {
  constructor(private readonly store: ImageHashStore) {
    super();
  }

  protected async check({ listing }: ModerationContext): Promise<ModerationResult> {
    const hashes = listing.data.photos.map((photo) =>
      createHash('sha256').update(photo.bytes).digest('hex'),
    );
    const duplicated = hashes.some((hash) => this.store.has(hash));
    hashes.forEach((hash) => this.store.add(hash));

    if (duplicated) {
      return { verdict: 'REJECTED', reasons: ['Fotoğraf daha önce başka bir ilanda kullanılmış'] };
    }
    return { verdict: 'APPROVED', reasons: [] };
  }
}
