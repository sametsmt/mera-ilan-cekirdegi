// KALIP: Builder (Yaratımsal) | ROL: Builder | Çözdüğü problem: Kategoriye göre değişen çok sayıda opsiyonel alanlı ilanı adım adım ve doğrulanarak kurmak.
import type { Listing } from '../../domain/Listing.js';
import type { Category, ImageInput, Sex, Species } from '../../domain/types.js';

// GoF rolü: Builder (soyut kurucu arayüzü)
export interface ListingBuilder {
  setTitle(title: string): ListingBuilder;
  setDescription(description: string): ListingBuilder;
  setCategory(category: Category): ListingBuilder;
  setSpecies(species: Species): ListingBuilder;
  setPrice(price: number): ListingBuilder;
  setProvince(province: string): ListingBuilder;
  addPhoto(photo: ImageInput): ListingBuilder;
  setSex(sex: Sex): ListingBuilder;
  setMilkYield(liters: number): ListingBuilder;
  setPregnant(pregnant: boolean): ListingBuilder;
  setBirthCount(count: number): ListingBuilder;
  setEarTagNo(earTagNo: string): ListingBuilder;
  setVideoUrl(url: string): ListingBuilder;
  build(): Listing;
}
