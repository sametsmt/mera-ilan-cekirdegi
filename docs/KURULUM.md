# Kurulum

[← README](../README.md) · [Test](TEST.md) · [Tasarım kalıpları](TASARIM_KALIPLARI.md)

## Gereksinimler

- **Node.js 20 veya üstü** (`package.json` içindeki `engines` alanı: `"node": ">=20"`)
- **npm** (Node ile birlikte gelir)
- Git

Sürümleri kontrol edin:

```bash
node -v   # v20.x veya üstü
npm -v
```

Testler ve varsayılan demo **internet ve API key gerektirmez**.

## Klonlama

```bash
git clone https://github.com/sametsmt/mera-ilan-cekirdegi.git
cd mera-ilan-cekirdegi
```

## Bağımlılıkları kurma

```bash
npm install
```

## Testleri ve tip denetimini çalıştırma

```bash
npm test          # 61 test
npm run lint      # tsc --noEmit (strict)
```

## `.env` ayarı (opsiyonel)

`.env` yalnızca **gerçek AI demosu** içindir. Teslim ve testler için gerekli değildir.

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```
ANTHROPIC_API_KEY=buraya-kendi-anahtariniz
ANTHROPIC_MODEL=
```

- `ANTHROPIC_MODEL` boş bırakılırsa varsayılan model `claude-haiku-5-5` kullanılır.
- `.env` Git'e eklenmez (`.gitignore` içinde). Anahtarınızı hiçbir zaman commit'lemeyin.

## Derleme

```bash
npm run build     # tsc -p tsconfig.build.json, çıktı dist/ klasörüne
```

## Demoyu çalıştırma

```bash
npm run demo
```

Varsayılan olarak `TestPipelineFactory` ve `FakeAIProvider` kullanılır. Üç senaryo konsola basılır: temiz ilan (`PUBLISHED`), dolandırıcı ilan (`REJECTED`), belirsiz ilan (`IN_MODERATION`). Beklenen çıktı için [TEST.md](TEST.md#manuel-test-senaryoları) bölümüne bakın.

## Gerçek AI ile demo (opsiyonel)

`.env` içine `ANTHROPIC_API_KEY` yazdıktan sonra:

```bash
USE_REAL_AI=true npm run demo
```

`USE_REAL_AI=true` ve `ANTHROPIC_API_KEY` birlikte varsa `ProductionPipelineFactory` kullanılır (`ClaudeProviderAdapter`, `CachingRateLimitedProviderProxy` ile sarılı). Çıktının ilk satırı `Mod: GERÇEK AI (Proxy + Adapter)` olur. İkisinden biri eksikse demo sessizce sahte AI moduna döner.

> **Not:** Gerçek AI demosu teslim için gerekli değildir. Demodaki fotoğraflar gerçek görsel değil, sahte bayttır. Bu yüzden gerçek Claude'un görsel adımı çoğunlukla `NEEDS_REVIEW`'a düşer ve temiz ilan `PUBLISHED` yerine `IN_MODERATION`'da kalabilir. Bu, Adapter'ın tasarım gereğidir: bozuk veya okunamayan yanıt hiçbir zaman `REJECTED` olmaz, her zaman `NEEDS_REVIEW` olur.

## Sık karşılaşılan hatalar

| Belirti | Neden | Çözüm |
|---|---|---|
| `npm install` motor uyarısı veya derleme hataları | Node sürümü 20'den eski | Node 20 veya üstüne geçin (`node -v`) |
| `.env` içindeki anahtar okunmuyor | Node 20.12'den eski sürümde `process.loadEnvFile` yok, `.env` okunmaz | Node'u güncelleyin ya da anahtarı komutla verin: `ANTHROPIC_API_KEY=... USE_REAL_AI=true npm run demo` |
| `USE_REAL_AI=true` verdim ama çıktı `Mod: SAHTE AI` | `ANTHROPIC_API_KEY` tanımlı değil, demo sahte moda döner | `.env` içine anahtarı yazın |
| `ANTHROPIC_API_KEY tanımlı değil (.env dosyasını kontrol edin)` | `ProductionPipelineFactory`'yi kendi kodunuzda anahtarsız ve `client` vermeden kurdunuz | Anahtarı tanımlayın veya `client` seçeneği verin |
| Gerçek AI demosunda `Yapay zekâ çağrısı başarısız: ...` nedeni | Geçersiz anahtar, ağ sorunu veya sağlayıcı hatası | Anahtarı ve bağlantıyı kontrol edin. İlan `NEEDS_REVIEW` olur, hata fırlatılmaz |
| `Yapay zekâ çağrı sınırı aşıldı; manuel inceleme gerekli` | Proxy'nin dakikada 10 çağrılık sınırı doldu | Bir dakika bekleyin. Sınır `ProductionPipelineFactory` seçeneği `maxCallsPerMinute` ile ayarlanır |
| `Yapay zekâ yanıtı çözümlenemedi` | Model JSON dışında yanıt verdi | Beklenen davranıştır, ilan `NEEDS_REVIEW` olur |
| `npm test` modül bulunamadı hatası verir | Bağımlılıklar kurulmamış | `npm install` çalıştırın |
