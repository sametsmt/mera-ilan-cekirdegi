// KALIP: Factory Method (Yaratımsal) | ROL: ConcreteCreator | Çözdüğü problem: Test ve demoda gerçek AI çağırmadan aynı zinciri sahte sağlayıcıyla kurmak.
import { FakeAIProvider } from '../adapter/FakeAIProvider.js';
import { ModerationPipelineFactory } from './ModerationPipelineFactory.js';

// GoF rolü: ConcreteCreator (ConcreteProduct: FakeAIProvider)
export class TestPipelineFactory extends ModerationPipelineFactory {
  // Testlerin çağrı sayısını okuyabilmesi için tek örnek tutulur.
  readonly fake = new FakeAIProvider();

  createProvider(): FakeAIProvider {
    return this.fake;
  }
}
