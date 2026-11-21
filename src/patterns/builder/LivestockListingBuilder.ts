// KALIP: Builder (Yaratımsal) | ROL: ConcreteBuilder | Çözdüğü problem: Zorunlu alan ve kategoriye özgü alan kurallarını build() anında tek yerde doğrulamak.
import { randomUUID } from 'node:crypto';
import type { Listing, ListingData } from '../../domain/Listing.js';
import {
  SPECIES_CATEGORY,
  type Category,
  type ImageInput,
  type Sex,
  type Species,
} from '../../domain/types.js';
import type { ListingBuilder } from './ListingBuilder.js';
import { LivestockListing } from './LivestockListing.js';

export class ListingValidationError extends Error {
  constructor(readonly problems: string[]) {
    super(`Geçersiz ilan: ${problems.join('; ')}`);
    this.name = 'ListingValidationError';
  }
}

// GoF rolü: ConcreteBuilder
export class LivestockListingBuilder implements ListingBuilder {
  private title?: string;
  private description?: string;
  private category?: Category;
  private species?: Species;
  private price?: number;
  private province?: string;
  private readonly photos: ImageInput[] = [];
  private sex?: Sex;
  private milkYieldLiters?: number;
  private pregnant?: boolean;
  private birthCount?: number;
  private earTagNo?: string;
  private videoUrl?: string;

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  setCategory(category: Category): this {
    this.category = category;
    return this;
  }

  setSpecies(species: Species): this {
    this.species = species;
    return this;
  }

  setPrice(price: number): this {
    this.price = price;
    return this;
  }

  setProvince(province: string): this {
    this.province = province;
    return this;
  }

  addPhoto(photo: ImageInput): this {
    this.photos.push(photo);
    return this;
  }

  setSex(sex: Sex): this {
    this.sex = sex;
    return this;
  }

  setMilkYield(liters: number): this {
    this.milkYieldLiters = liters;
    return this;
  }

  setPregnant(pregnant: boolean): this {
    this.pregnant = pregnant;
    return this;
  }

  setBirthCount(count: number): this {
    this.birthCount = count;
    return this;
  }

  setEarTagNo(earTagNo: string): this {
    this.earTagNo = earTagNo;
    return this;
  }

  setVideoUrl(url: string): this {
    this.videoUrl = url;
    return this;
  }

  build(): Listing {
    const problems = this.validate();
    if (problems.length > 0) throw new ListingValidationError(problems);

    const data: ListingData = {
      id: randomUUID(),
      title: this.title!.trim(),
      category: this.category!,
      species: this.species!,
      price: this.price!,
      province: this.province!.trim(),
      photos: [...this.photos],
      ...(this.description !== undefined && { description: this.description }),
      ...(this.sex !== undefined && { sex: this.sex }),
      ...(this.milkYieldLiters !== undefined && { milkYieldLiters: this.milkYieldLiters }),
      ...(this.pregnant !== undefined && { pregnant: this.pregnant }),
      ...(this.birthCount !== undefined && { birthCount: this.birthCount }),
      ...(this.earTagNo !== undefined && { earTagNo: this.earTagNo }),
      ...(this.videoUrl !== undefined && { videoUrl: this.videoUrl }),
    };
    return new LivestockListing(data);
  }

  private validate(): string[] {
    const problems: string[] = [];
    if (!this.title?.trim()) problems.push('başlık zorunlu');
    if (!this.category) problems.push('kategori zorunlu');
    if (!this.species) problems.push('tür zorunlu');
    if (this.price === undefined || !(this.price > 0)) problems.push('fiyat 0’dan büyük olmalı');
    if (!this.province?.trim()) problems.push('il zorunlu');
    if (this.photos.length === 0) problems.push('en az 1 fotoğraf zorunlu');

    if (this.category && this.species && SPECIES_CATEGORY[this.species] !== this.category) {
      problems.push(`${this.species} türü ${this.category} kategorisine ait değil`);
    }

    const isLivestock = this.category === 'BUYUKBAS' || this.category === 'KUCUKBAS';
    const isFemaleLivestock = isLivestock && this.sex === 'female';
    if (this.milkYieldLiters !== undefined && !isFemaleLivestock) {
      problems.push('süt verimi yalnızca büyükbaş/küçükbaş dişi için geçerli');
    }
    if (this.milkYieldLiters !== undefined && this.milkYieldLiters < 0) {
      problems.push('süt verimi negatif olamaz');
    }
    if ((this.pregnant !== undefined || this.birthCount !== undefined) && !isFemaleLivestock) {
      problems.push('gebelik/doğum sayısı yalnızca büyükbaş/küçükbaş dişi için geçerli');
    }
    if (this.earTagNo !== undefined && !isLivestock) {
      problems.push('küpe no yalnızca büyükbaş/küçükbaş için geçerli');
    }
    return problems;
  }
}
