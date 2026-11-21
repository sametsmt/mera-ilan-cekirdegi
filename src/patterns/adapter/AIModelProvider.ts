// KALIP: Adapter (Yapısal) | ROL: Target | Çözdüğü problem: Uygulamanın, yapay zekâ sağlayıcısından bağımsız tek bir arayüzle konuşması.
import type { ImageInput, ModerationResult } from '../../domain/types.js';

// GoF rolü: Target (istemcinin beklediği arayüz; Proxy de bunu uygular)
export interface AIModelProvider {
  analyzeText(text: string): Promise<ModerationResult>;
  analyzeImage(image: ImageInput): Promise<ModerationResult>;
}
