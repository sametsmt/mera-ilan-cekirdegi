import type { Listing } from '../src/domain/Listing.js';
import type { ImageInput } from '../src/domain/types.js';
import type { ListingBuilder } from '../src/patterns/builder/ListingBuilder.js';
import { LivestockListingBuilder } from '../src/patterns/builder/LivestockListingBuilder.js';

let counter = 0;

export function photo(id = 'cow-1', content?: string): ImageInput {
  counter++;
  return { id, url: `https://ornek.test/${id}.jpg`, bytes: Buffer.from(content ?? `${id}-${counter}`) };
}

// Geçerli, süt verimli bir inek ilanı kurar; testler ihtiyaca göre değiştirir.
export function validBuilder(): ListingBuilder {
  return new LivestockListingBuilder()
    .setTitle('Süt verimli inek')
    .setCategory('BUYUKBAS')
    .setSpecies('cattle')
    .setSex('female')
    .setPrice(90000)
    .setProvince('Konya')
    .addPhoto(photo('cow-1'));
}

export function validListing(): Listing {
  return validBuilder().build();
}
