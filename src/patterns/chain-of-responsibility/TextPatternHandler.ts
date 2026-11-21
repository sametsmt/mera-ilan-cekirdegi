// KALIP: Chain of Responsibility (Davranışsal) | ROL: ConcreteHandler | Çözdüğü problem: IBAN, kapora ve uygulama dışına yönlendirmeyi AI'a gitmeden regex ile ucuza yakalamak.
import type { ModerationResult } from '../../domain/types.js';
import { ModerationHandler, type ModerationContext } from './ModerationHandler.js';

const IBAN = /\bTR\s?\d{2}(?:\s?\d{4}){5}\s?\d{2}\b/i;
const PHONE = /(?:\+?90|0)?[\s.-]?\(?5\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/;
const OFF_PLATFORM = /\b(?:whats\s?app|telegram|wp|instagram|dm)\b/i;
const DEPOSIT = /\bkapora\b/i;

// GoF rolü: ConcreteHandler (en ucuz kontrol, zincirin başı)
export class TextPatternHandler extends ModerationHandler {
  protected async check({ listing }: ModerationContext): Promise<ModerationResult> {
    const text = `${listing.data.title}\n${listing.data.description ?? ''}`;
    const rejections: string[] = [];
    const reviews: string[] = [];

    if (IBAN.test(text)) rejections.push('Metinde IBAN var');
    if (PHONE.test(text) || OFF_PLATFORM.test(text)) {
      rejections.push('Uygulama dışına yönlendirme (telefon/WhatsApp/Telegram)');
    }
    if (DEPOSIT.test(text)) reviews.push('Metinde "kapora" ifadesi var');

    if (rejections.length > 0) {
      return { verdict: 'REJECTED', reasons: [...rejections, ...reviews] };
    }
    if (reviews.length > 0) return { verdict: 'NEEDS_REVIEW', reasons: reviews };
    return { verdict: 'APPROVED', reasons: [] };
  }
}
