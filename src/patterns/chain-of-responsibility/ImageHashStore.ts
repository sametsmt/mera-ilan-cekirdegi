// KALIP: Chain of Responsibility (Davranışsal) | ROL: Handler'ın yardımcı bağımlılığı | Çözdüğü problem: Daha önce görülen fotoğraf hash'lerini enjekte edilebilir bir depoda tutmak.

export interface ImageHashStore {
  has(hash: string): boolean;
  add(hash: string): void;
}

export class InMemoryImageHashStore implements ImageHashStore {
  private readonly hashes = new Set<string>();

  has(hash: string): boolean {
    return this.hashes.has(hash);
  }

  add(hash: string): void {
    this.hashes.add(hash);
  }
}
