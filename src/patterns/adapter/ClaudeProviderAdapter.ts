// KALIP: Adapter (Yapısal) | ROL: Adapter | Çözdüğü problem: Anthropic SDK'nın mesaj/JSON arayüzünü kendi AIModelProvider tiplerimize çevirmek.
import {
  isSpecies,
  type ImageInput,
  type ModerationResult,
  type Verdict,
} from '../../domain/types.js';
import type { AIModelProvider } from './AIModelProvider.js';

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

export interface MessageRequest {
  model: string;
  max_tokens: number;
  system: string;
  messages: { role: 'user'; content: string | ContentBlock[] }[];
}

export interface MessageResponse {
  content: { type: string; text?: string }[];
}

// GoF rolü: Adaptee (Anthropic SDK istemcisinin kullandığımız yüzü; gerçek istemci buna uyar)
export interface AnthropicLike {
  messages: { create(params: MessageRequest): Promise<MessageResponse> };
}

export const DEFAULT_MODEL = 'claude-haiku-5-5';

const VERDICTS: readonly Verdict[] = ['APPROVED', 'NEEDS_REVIEW', 'REJECTED'];

const TEXT_SYSTEM =
  'Sen bir hayvan ilanı moderatörüsün. İlan metnini değerlendir. Yalnızca JSON döndür: ' +
  '{"verdict":"APPROVED|NEEDS_REVIEW|REJECTED","reasons":["..."]}. Emin değilsen NEEDS_REVIEW kullan.';

const IMAGE_SYSTEM =
  'Sen bir hayvan ilanı moderatörüsün. Fotoğrafta hangi hayvan olduğunu belirle. Yalnızca JSON döndür: ' +
  '{"verdict":"APPROVED|NEEDS_REVIEW|REJECTED","reasons":["..."],' +
  '"detectedSpecies":"cattle|sheep|goat|chicken|turkey|goose|duck|none"}. ' +
  'Hayvan yoksa detectedSpecies "none" olsun. Emin değilsen NEEDS_REVIEW kullan.';

// GoF rolü: Adapter
export class ClaudeProviderAdapter implements AIModelProvider {
  private readonly model: string;

  constructor(
    private readonly client: AnthropicLike,
    model?: string,
  ) {
    this.model = model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  }

  analyzeText(text: string): Promise<ModerationResult> {
    return this.ask(TEXT_SYSTEM, text);
  }

  async analyzeImage(image: ImageInput): Promise<ModerationResult> {
    if (image.bytes.length === 0) {
      return { verdict: 'NEEDS_REVIEW', reasons: [`Görsel boş: ${image.id}`] };
    }
    return this.ask(IMAGE_SYSTEM, [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mediaType ?? inferMediaType(image.url),
          data: image.bytes.toString('base64'),
        },
      },
      { type: 'text', text: 'Bu fotoğrafı değerlendir.' },
    ]);
  }

  private async ask(system: string, content: string | ContentBlock[]): Promise<ModerationResult> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 300,
        system,
        messages: [{ role: 'user', content }],
      });
      const raw = response.content.find((block) => block.type === 'text')?.text ?? '';
      return parseModelReply(raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { verdict: 'NEEDS_REVIEW', reasons: [`Yapay zekâ çağrısı başarısız: ${message}`] };
    }
  }
}

function inferMediaType(url: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' {
  const lower = url.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

// Parse edilemeyen yanıt asla REJECTED olmaz; NEEDS_REVIEW olur.
export function parseModelReply(raw: string): ModerationResult {
  const unparsable: ModerationResult = {
    verdict: 'NEEDS_REVIEW',
    reasons: ['Yapay zekâ yanıtı çözümlenemedi'],
  };
  const json = raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return unparsable;
  }
  if (typeof parsed !== 'object' || parsed === null) return unparsable;

  const { verdict, reasons, detectedSpecies } = parsed as Record<string, unknown>;
  if (typeof verdict !== 'string' || !VERDICTS.includes(verdict as Verdict)) return unparsable;
  if (!Array.isArray(reasons) || !reasons.every((r) => typeof r === 'string')) return unparsable;

  const result: ModerationResult = { verdict: verdict as Verdict, reasons: reasons as string[] };
  if (typeof detectedSpecies === 'string' && (detectedSpecies === 'none' || isSpecies(detectedSpecies))) {
    result.detectedSpecies = detectedSpecies;
  }
  return result;
}
