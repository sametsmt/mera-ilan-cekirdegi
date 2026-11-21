import { describe, expect, it, vi } from 'vitest';
import {
  ClaudeProviderAdapter,
  DEFAULT_MODEL,
  type AnthropicLike,
} from '../src/patterns/adapter/ClaudeProviderAdapter.js';
import { FakeAIProvider } from '../src/patterns/adapter/FakeAIProvider.js';
import { photo } from './helpers.js';

function clientReplying(text: string) {
  const create = vi.fn().mockResolvedValue({ content: [{ type: 'text', text }] });
  return { client: { messages: { create } } as AnthropicLike, create };
}

describe('Adapter: ClaudeProviderAdapter', () => {
  it('JSON yanıtı kendi tipimize çevirir', async () => {
    const { client } = clientReplying('{"verdict":"REJECTED","reasons":["IBAN var"]}');
    const result = await new ClaudeProviderAdapter(client).analyzeText('metin');
    expect(result).toEqual({ verdict: 'REJECTED', reasons: ['IBAN var'] });
  });

  it('```json çitli yanıtı da çözer ve görsel türünü okur', async () => {
    const { client, create } = clientReplying(
      '```json\n{"verdict":"APPROVED","reasons":[],"detectedSpecies":"cattle"}\n```',
    );
    const result = await new ClaudeProviderAdapter(client).analyzeImage(photo('cow-1'));
    expect(result).toEqual({ verdict: 'APPROVED', reasons: [], detectedSpecies: 'cattle' });
    const sent = create.mock.calls[0]![0];
    expect(sent.messages[0].content[0].source.type).toBe('base64');
  });

  it('bozuk JSON NEEDS_REVIEW olur, asla REJECTED olmaz', async () => {
    const { client } = clientReplying('bu bir json değil');
    const result = await new ClaudeProviderAdapter(client).analyzeText('metin');
    expect(result.verdict).toBe('NEEDS_REVIEW');
  });

  it('geçersiz verdict veya reasons NEEDS_REVIEW olur', async () => {
    for (const body of ['{"verdict":"MAYBE","reasons":[]}', '{"verdict":"REJECTED","reasons":"x"}', '42', 'null']) {
      const { client } = clientReplying(body);
      expect((await new ClaudeProviderAdapter(client).analyzeText('m')).verdict).toBe('NEEDS_REVIEW');
    }
  });

  it('SDK hatasında NEEDS_REVIEW döner', async () => {
    const client: AnthropicLike = { messages: { create: vi.fn().mockRejectedValue(new Error('429')) } };
    const result = await new ClaudeProviderAdapter(client).analyzeText('metin');
    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(result.reasons[0]).toContain('429');
  });

  it('boş görselde API çağırmadan NEEDS_REVIEW döner', async () => {
    const { client, create } = clientReplying('{}');
    const empty = { id: 'x', url: 'x.png', bytes: Buffer.alloc(0) };
    const result = await new ClaudeProviderAdapter(client).analyzeImage(empty);
    expect(result.verdict).toBe('NEEDS_REVIEW');
    expect(create).not.toHaveBeenCalled();
  });

  it('modeli ANTHROPIC_MODEL’den okur, yoksa varsayılanı kullanır', async () => {
    const previous = process.env.ANTHROPIC_MODEL;
    try {
      delete process.env.ANTHROPIC_MODEL;
      const a = clientReplying('{"verdict":"APPROVED","reasons":[]}');
      await new ClaudeProviderAdapter(a.client).analyzeText('m');
      expect(a.create.mock.calls[0]![0].model).toBe(DEFAULT_MODEL);

      process.env.ANTHROPIC_MODEL = 'ozel-model';
      const b = clientReplying('{"verdict":"APPROVED","reasons":[]}');
      await new ClaudeProviderAdapter(b.client).analyzeText('m');
      expect(b.create.mock.calls[0]![0].model).toBe('ozel-model');
    } finally {
      if (previous === undefined) delete process.env.ANTHROPIC_MODEL;
      else process.env.ANTHROPIC_MODEL = previous;
    }
  });

  it('png/webp/gif uzantısından medya türünü çıkarır', async () => {
    const { client, create } = clientReplying('{"verdict":"APPROVED","reasons":[]}');
    const adapter = new ClaudeProviderAdapter(client);
    for (const ext of ['png', 'webp', 'gif']) {
      await adapter.analyzeImage({ id: 'a', url: `a.${ext}`, bytes: Buffer.from('x') });
    }
    const types = create.mock.calls.map((c) => c[0].messages[0].content[0].source.media_type);
    expect(types).toEqual(['image/png', 'image/webp', 'image/gif']);
  });
});

describe('FakeAIProvider', () => {
  it('anahtar kelimeye göre deterministik sonuç verir ve çağrıları sayar', async () => {
    const fake = new FakeAIProvider();
    expect((await fake.analyzeText('bu bir dolandırıcılık')).verdict).toBe('REJECTED');
    expect((await fake.analyzeText('belki')).verdict).toBe('NEEDS_REVIEW');
    expect((await fake.analyzeText('normal')).verdict).toBe('APPROVED');
    expect((await fake.analyzeImage(photo('tractor-1'))).detectedSpecies).toBe('none');
    expect((await fake.analyzeImage(photo('blurry-cow'))).verdict).toBe('NEEDS_REVIEW');
    expect((await fake.analyzeImage(photo('sheep-2'))).detectedSpecies).toBe('sheep');
    expect((await fake.analyzeImage(photo('xyz'))).verdict).toBe('NEEDS_REVIEW');
    expect((await fake.analyzeImage({ id: 'e', url: 'e', bytes: Buffer.alloc(0) })).verdict).toBe('NEEDS_REVIEW');
    expect(fake.textCalls).toBe(3);
    expect(fake.imageCalls).toBe(5);
    expect(fake.totalCalls).toBe(8);
  });
});
