# Test

[← README](../README.md) · [Kurulum](KURULUM.md) · [Tasarım kalıpları](TASARIM_KALIPLARI.md)

## Test stratejisi

Testler [Vitest](https://vitest.dev) ile yazılmıştır ve iki katmandan oluşur:

- **Birim testleri (kalıp başına).** Her kalıp kendi dosyasında, diğer kalıplardan yalıtılmış olarak sınanır: `tests/builder.test.ts`, `tests/factory-method.test.ts`, `tests/adapter.test.ts`, `tests/proxy.test.ts`, `tests/decorator.test.ts`, `tests/chain-of-responsibility.test.ts`, `tests/state.test.ts`.
- **Entegrasyon testleri.** `tests/integration.test.ts`, `ListingService` üzerinden tüm kalıpları birlikte uçtan uca çalıştırır: ilan kurulur, zincir çalışır, state geçişi olur, dekorasyon uygulanır.

### AI neden FakeAIProvider ile taklit ediliyor?

Testler gerçek Anthropic API'sini hiç çağırmaz. AI, `src/patterns/adapter/FakeAIProvider.ts` ile taklit edilir. Gerekçeler:

- **İnternetsiz:** testler her ortamda ve çevrimdışı çalışır.
- **Deterministik:** anahtar kelimeye göre sonuç sabittir (ör. görsel adında `tractor` geçerse `REJECTED`, `blurry` geçerse `NEEDS_REVIEW`). Gerçek model her seferinde aynı yanıtı vermez.
- **Maliyetsiz:** her test çalıştırması para harcamaz, API anahtarı gerekmez.
- **Çağrı sayısı ölçülebilir:** `FakeAIProvider` `textCalls`, `imageCalls` ve `totalCalls` sayaçlarını tutar. Böylece "kesin reddedilen ilanda AI hiç çağrılmadı" gibi zincirin maliyet garantisi doğrudan test edilir.

`ClaudeProviderAdapter` ise SDK yerine elle yazılmış sahte istemciyle (`vi.fn()`) sınanır. Bu sayede JSON ayrıştırma ve hata yolları ağ olmadan doğrulanır.

Proxy testlerinde saat de enjekte edilir (`clock: () => time.now`). Dakikalık sınırın sıfırlanması gerçek zaman beklenmeden test edilir.

## Komutlar

```bash
npm test                 # tüm testler (vitest run)
npm run test:coverage    # testler + coverage (v8), eşik %80
npm run lint             # tsc --noEmit
```

`vitest.config.ts` coverage'a `src/**/*.ts` dosyalarını dahil eder, `src/demo.ts` dosyasını hariç tutar ve satır, fonksiyon, dal ve ifade için %80 eşiği koyar.

## Test dosyaları

Toplam: **8 dosya, 61 test**.

| Dosya | Kalıp | Test sayısı | Doğrulananlar |
|---|---|---|---|
| `tests/builder.test.ts` | Builder | 8 | Geçerli ilan kurulur ve opsiyonel alanlar taşınır; eksik zorunlu alanların hepsi (6 sorun) raporlanır; fotoğrafsız ilan reddedilir; süt verimi erkek hayvanda ve kanatlıda reddedilir; tür kategoriyle uyuşmazsa hata verir; küpe no ve gebelik kuralları; negatif süt verimi reddedilir |
| `tests/factory-method.test.ts` | Factory Method | 5 | `TestPipelineFactory` `FakeAIProvider` döner; `ProductionPipelineFactory` Adapter'ı saran Proxy döner (`instanceof`, ağ çağrısı yok); `createChain()` 4 handler'ı ucuzdan pahalıya kurar; API key yoksa açık hata; seçenekler Proxy'ye iletilir |
| `tests/adapter.test.ts` | Adapter (+ FakeAIProvider) | 9 | JSON yanıt doğru tipe çevrilir; ` ```json ` çitli yanıt çözülür ve görsel base64 gönderilir; bozuk JSON, geçersiz verdict ve geçersiz `reasons` `NEEDS_REVIEW` olur; SDK hatası `NEEDS_REVIEW` olur; boş görselde API çağrılmaz; model `ANTHROPIC_MODEL`'den okunur, yoksa `claude-haiku-5-5`; png/webp/gif medya türü çıkarımı; `FakeAIProvider` deterministik sonuç ve sayaçlar |
| `tests/proxy.test.ts` | Proxy | 7 | Aynı metin ve aynı görsel baytı için iç sağlayıcı 1 kez çağrılır; dakikalık sınır aşılınca `NEEDS_REVIEW` döner ve iç sağlayıcı çağrılmaz; zaman ilerleyince limit sıfırlanır; önbellekten dönen cevap limite sayılmaz; `NEEDS_REVIEW` cache'lenmez; varsayılan ayarlar |
| `tests/decorator.test.ts` | Decorator | 6 | Çıplak ilan taban puanda; tek dekorasyon rozet ve puan ekler; iç içe dekorasyonda birikim; sarma sırası fark etmez; süresi dolan doping etki etmez; özel doping puanı |
| `tests/chain-of-responsibility.test.ts` | Chain of Responsibility | 10 | IBAN'da `REJECTED` ve **AI çağrı sayısı 0**; telefon/WhatsApp/Telegram `REJECTED`, kapora tek başına `NEEDS_REVIEW`; kopya fotoğrafta `REJECTED` ve AI çağrılmaz; temiz ilanda 4 handler çalışır; `NEEDS_REVIEW` birleşimi (en kötü verdict + tüm nedenler); hayvan yoksa `REJECTED`; tür uyuşmazlığı `REJECTED`; tür belirlenemezse `NEEDS_REVIEW`; `DuplicateImageHandler` tekrarı yakalar; `worstVerdict` ve `mergeResults` |
| `tests/state.test.ts` | State | 12 | `Draft → InModeration`; `APPROVED → Published`, `REJECTED → Rejected`; `NEEDS_REVIEW` InModeration'da kalır, manuel onay yayınlar; manuel red; `markSold` ve `expire`; reddedilen ilan yayına giremez; satılmış ilan düzenlenemez; taslakta geçersiz işlemler; tekrar `submit` geçersiz; `publish()` InModeration'da çalışır; taslakta `edit`; yalnızca yayındaki ilan `decorate` edilir |
| `tests/integration.test.ts` | Hepsi (`ListingService`) | 4 | Temiz ilan → `PUBLISHED` ve dekorasyon (puan 170); dolandırıcı ilan → `REJECTED`, AI hiç çağrılmaz; belirsiz ilan → `IN_MODERATION`, manuel onayla `PUBLISHED`; geçersiz ilan Builder'da durur, zincire girmez |

`tests/helpers.ts` ortak yardımcılardır (`photo`, `validBuilder`, `validListing`), test içermez.

## Coverage sonucu

`npm run test:coverage` komutunun gerçek çıktısı:

```
 Test Files  8 passed (8)
      Tests  61 passed (61)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |    99.1 |    97.23 |     100 |   98.99 |                   
 patterns/adapter  |     100 |    95.65 |     100 |     100 |                   
  ...derAdapter.ts |     100 |    94.11 |     100 |     100 | 84-87             
 ...responsibility |   96.77 |    93.75 |     100 |   96.29 |                   
  ...oryHandler.ts |   88.88 |       80 |     100 |    87.5 | 26,29             
 ...factory-method |   93.33 |       90 |     100 |   92.85 |                   
  ...ineFactory.ts |    87.5 |    88.88 |     100 |   85.71 | 36                
-------------------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 99.1% ( 332/335 )
Branches     : 97.23% ( 176/181 )
Functions    : 100% ( 123/123 )
Lines        : 98.99% ( 296/299 )
================================================================================
```

Araç yalnızca %100'ün altındaki dosyaları listeler; listede olmayan dosyaların hepsi %100'dür. Tüm metrikler %80 eşiğinin üzerindedir.

Kapsanmayan satırlar:

- `ClaudeProviderAdapter.ts` 84-87: yanıtta metin bloğu olmadığında `?? ''` dalı ve `Error` olmayan bir değer fırlatıldığında `String(error)` dalı.
- `ImageCategoryHandler.ts` 26, 29: sağlayıcı `APPROVED` dönüp `detectedSpecies` vermediğinde veya `none` verdiğinde `evaluate()` içindeki iki dal. `FakeAIProvider` bu kombinasyonları üretmez.
- `ProductionPipelineFactory.ts` 36: gerçek `new Anthropic({ apiKey })` istemcisinin kurulduğu satır. Testler gerçek istemciyi bilerek kurmaz (internetsiz ve anahtarsız çalışma kuralı).

## Manuel test senaryoları

`npm run demo` komutu 3 senaryoyu sahte AI ile çalıştırır. Beklenen çıktı:

```
Mod: SAHTE AI (TestPipelineFactory)
```

### Senaryo 1: Temiz ilan → PUBLISHED

Süt verimi 28 litre olan dişi Holstein inek, fotoğraf `cow-1`, mağaza + doping + Kurban dekorasyonlu.

```
=== Senaryo 1: Temiz ilan ===
İlan        : Süt verimi yüksek Holstein inek (cattle, 95000 TL, Konya)
Çalışan zincir: TextPatternHandler → DuplicateImageHandler → TextAIHandler → ImageCategoryHandler
Verdict     : APPROVED
Nedenler    : -
Durum geçişi: DRAFT → IN_MODERATION → PUBLISHED
Rozetler    : Kurban, Doping, Kurumsal Mağaza: Konya Çiftliği | Sıralama puanı: 180
```

Beklenen: 4 handler çalışır, ilan yayına çıkar, rozetler birikir (100 taban + 10 Kurban + 50 doping + 20 mağaza = 180).

### Senaryo 2: Dolandırıcı ilan → REJECTED, AI çağrısı yok

Açıklamada IBAN, "kapora" ve WhatsApp yönlendirmesi var.

```
=== Senaryo 2: Dolandırıcı ilan ===
İlan        : Acil koyun satılık (sheep, 8000 TL, Ankara)
Çalışan zincir: TextPatternHandler
Verdict     : REJECTED
Nedenler    : Metinde IBAN var; Uygulama dışına yönlendirme (telefon/WhatsApp/Telegram); Metinde "kapora" ifadesi var
Durum geçişi: DRAFT → IN_MODERATION → REJECTED
Rozetler    : - | Sıralama puanı: 100
```

Beklenen: yalnızca `TextPatternHandler` çalışır, zincir durur. AI adımlarına hiç ulaşılmaz.

### Senaryo 3: Belirsiz ilan → IN_MODERATION

Fotoğraf adı `blurry-goat`, yani net olmayan görsel.

```
=== Senaryo 3: Belirsiz ilan (manuel inceleme) ===
İlan        : Keçi sürüsü (goat, 40000 TL, İzmir)
Çalışan zincir: TextPatternHandler → DuplicateImageHandler → TextAIHandler → ImageCategoryHandler
Verdict     : NEEDS_REVIEW
Nedenler    : Görsel net değil
Durum geçişi: DRAFT → IN_MODERATION
Rozetler    : - | Sıralama puanı: 100
```

Beklenen: 4 handler çalışır, ilan `IN_MODERATION`'da kalır. Manuel `approveManually()` veya `rejectManually()` beklenir.

Çıktının son satırı:

```
Sahte AI toplam çağrı: 4 (metin 2, görsel 2)
```

Dolandırıcı ilan AI'a hiç gitmediği için 4 çağrı yalnızca senaryo 1 ve 3'ten gelir.
