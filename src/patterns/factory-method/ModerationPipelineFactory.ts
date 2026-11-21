// KALIP: Factory Method (Yaratımsal) | ROL: Creator | Çözdüğü problem: Moderasyon zincirinin hangi AI sağlayıcısıyla kurulacağına alt sınıfın karar vermesi.
import type { AIModelProvider } from '../adapter/AIModelProvider.js';
import { DuplicateImageHandler } from '../chain-of-responsibility/DuplicateImageHandler.js';
import { ImageCategoryHandler } from '../chain-of-responsibility/ImageCategoryHandler.js';
import { InMemoryImageHashStore, type ImageHashStore } from '../chain-of-responsibility/ImageHashStore.js';
import type { ModerationHandler } from '../chain-of-responsibility/ModerationHandler.js';
import { TextAIHandler } from '../chain-of-responsibility/TextAIHandler.js';
import { TextPatternHandler } from '../chain-of-responsibility/TextPatternHandler.js';

// GoF rolü: Creator (createProvider() soyut fabrika metodu; createChain() onu kullanan fabrika metodu)
export abstract class ModerationPipelineFactory {
  constructor(protected readonly hashStore: ImageHashStore = new InMemoryImageHashStore()) {}

  abstract createProvider(): AIModelProvider;

  // Sıra ucuzdan pahalıya: regex → kopya fotoğraf → metin AI → görsel AI.
  createChain(): ModerationHandler {
    const provider = this.createProvider();
    const head = new TextPatternHandler();
    head
      .setNext(new DuplicateImageHandler(this.hashStore))
      .setNext(new TextAIHandler(provider))
      .setNext(new ImageCategoryHandler(provider));
    return head;
  }
}
