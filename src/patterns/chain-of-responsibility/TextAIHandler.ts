// KALIP: Chain of Responsibility (Davranışsal) | ROL: ConcreteHandler | Çözdüğü problem: Ucuz kontrolleri geçen ilanların metnini yapay zekâya sormak.
import type { ModerationResult } from '../../domain/types.js';
import type { AIModelProvider } from '../adapter/AIModelProvider.js';
import { ModerationHandler, type ModerationContext } from './ModerationHandler.js';

// GoF rolü: ConcreteHandler (pahalı adım)
export class TextAIHandler extends ModerationHandler {
  constructor(private readonly provider: AIModelProvider) {
    super();
  }

  protected check({ listing }: ModerationContext): Promise<ModerationResult> {
    return this.provider.analyzeText(`${listing.data.title}\n${listing.data.description ?? ''}`);
  }
}
