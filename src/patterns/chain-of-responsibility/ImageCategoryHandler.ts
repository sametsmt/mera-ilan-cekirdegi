// KALIP: Chain of Responsibility (Davranışsal) | ROL: ConcreteHandler | Çözdüğü problem: Fotoğrafta hayvan olduğunu ve türünün ilanla uyuştuğunu doğrulamak.
import { mergeResults } from '../../domain/moderation.js';
import type { ModerationResult } from '../../domain/types.js';
import type { AIModelProvider } from '../adapter/AIModelProvider.js';
import { ModerationHandler, type ModerationContext } from './ModerationHandler.js';

// GoF rolü: ConcreteHandler (en pahalı adım, zincirin sonu)
export class ImageCategoryHandler extends ModerationHandler {
  constructor(private readonly provider: AIModelProvider) {
    super();
  }

  protected async check({ listing }: ModerationContext): Promise<ModerationResult> {
    let combined: ModerationResult = { verdict: 'APPROVED', reasons: [] };
    for (const photo of listing.data.photos) {
      const analysis = await this.provider.analyzeImage(photo);
      combined = mergeResults(combined, this.evaluate(analysis, listing.data.species));
      if (combined.verdict === 'REJECTED') break;
    }
    return combined;
  }

  private evaluate(analysis: ModerationResult, listedSpecies: string): ModerationResult {
    if (analysis.verdict !== 'APPROVED') return analysis;
    if (!analysis.detectedSpecies) {
      return { ...analysis, verdict: 'NEEDS_REVIEW', reasons: [...analysis.reasons, 'Görselde tür belirlenemedi'] };
    }
    if (analysis.detectedSpecies === 'none') {
      return { ...analysis, verdict: 'REJECTED', reasons: [...analysis.reasons, 'Görselde hayvan yok'] };
    }
    if (analysis.detectedSpecies !== listedSpecies) {
      return {
        ...analysis,
        verdict: 'REJECTED',
        reasons: [
          ...analysis.reasons,
          `Görseldeki tür (${analysis.detectedSpecies}) ilan türüyle (${listedSpecies}) uyuşmuyor`,
        ],
      };
    }
    return analysis;
  }
}
