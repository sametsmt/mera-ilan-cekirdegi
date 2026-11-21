// KALIP: Adapter (Yapısal) | ROL: Target'ın test gerçeklemesi | Çözdüğü problem: Testlerde ve demoda ağsız, deterministik ve çağrısı sayılabilir sağlayıcı sunmak.
import type { ImageInput, ModerationResult } from '../../domain/types.js';
import type { AIModelProvider } from './AIModelProvider.js';

const SCAM_WORDS = ['dolandır', 'scam', 'bahis'];
const DOUBT_WORDS = ['şüpheli', 'suspicious', 'belki'];
const NO_ANIMAL_WORDS = ['tractor', 'traktor', 'car', 'araba'];
const BLURRY_WORDS = ['blurry', 'bulanik'];
const SPECIES_WORDS: [string, string][] = [
  ['cattle', 'cattle'],
  ['cow', 'cattle'],
  ['inek', 'cattle'],
  ['sheep', 'sheep'],
  ['koyun', 'sheep'],
  ['goat', 'goat'],
  ['keci', 'goat'],
  ['chicken', 'chicken'],
  ['tavuk', 'chicken'],
  ['turkey', 'turkey'],
  ['hindi', 'turkey'],
  ['goose', 'goose'],
  ['kaz', 'goose'],
  ['duck', 'duck'],
  ['ordek', 'duck'],
];

// GoF rolü: ConcreteTarget (test için sahte sağlayıcı)
export class FakeAIProvider implements AIModelProvider {
  textCalls = 0;
  imageCalls = 0;

  get totalCalls(): number {
    return this.textCalls + this.imageCalls;
  }

  async analyzeText(text: string): Promise<ModerationResult> {
    this.textCalls++;
    const lower = text.toLowerCase();
    if (SCAM_WORDS.some((w) => lower.includes(w))) {
      return { verdict: 'REJECTED', reasons: ['Metinde dolandırıcılık belirtisi'] };
    }
    if (DOUBT_WORDS.some((w) => lower.includes(w))) {
      return { verdict: 'NEEDS_REVIEW', reasons: ['Metin şüpheli bulundu'] };
    }
    return { verdict: 'APPROVED', reasons: [] };
  }

  async analyzeImage(image: ImageInput): Promise<ModerationResult> {
    this.imageCalls++;
    if (image.bytes.length === 0) {
      return { verdict: 'NEEDS_REVIEW', reasons: [`Görsel boş: ${image.id}`] };
    }
    const name = `${image.id} ${image.url}`.toLowerCase();
    if (NO_ANIMAL_WORDS.some((w) => name.includes(w))) {
      return { verdict: 'REJECTED', reasons: ['Görselde hayvan yok'], detectedSpecies: 'none' };
    }
    if (BLURRY_WORDS.some((w) => name.includes(w))) {
      return { verdict: 'NEEDS_REVIEW', reasons: ['Görsel net değil'] };
    }
    const match = SPECIES_WORDS.find(([word]) => name.includes(word));
    if (match) return { verdict: 'APPROVED', reasons: [], detectedSpecies: match[1] };
    return { verdict: 'NEEDS_REVIEW', reasons: ['Görseldeki tür belirlenemedi'] };
  }
}
