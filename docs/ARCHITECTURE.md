# Mimari Özet — CV Roast TR

## Veri Akışı (Uçtan Uca)

```text
[Kullanıcı (PDF / Metin + Ton + Sektör + Opsiyonel İlan + Opsiyonel BYOK)]
        │
        ▼
POST /api/roast  (Next.js App Router, Node.js runtime)
  ├─ 1. In-Memory IP Rate Limit (src/lib/security/rate-limit.ts)
  ├─ 2. PDF ise bellek içi metin çıkarma (src/lib/pdf/extract.ts, unpdf, max 5MB, %PDF- kontrolü)
  ├─ 3. Kelime sınırı doğrulaması (max 6.000 kelime)
  ├─ 4. PII Maskeleme (src/lib/privacy/pii-masker.ts) — LLM'e gitmeden önce!
  ├─ 5. Modüler Prompt Birleştirme (src/lib/prompts/composer.ts)
  │     └─ prompts/base.md + prompts/{tone}.md + prompts/sectors/{sector}.md
  │     └─ Prompt injection delimiter izolasyonu
  ├─ 6. Provider-Agnostic LLM Çağrısı (src/lib/llm/)
  │     └─ Gemini (varsayılan) | OpenAI | Anthropic
  ├─ 7. JSON Ayrıştırma & Zod Şema Doğrulama (src/lib/schemas/roast.ts)
  ├─ 8. Halüsinasyon Koruması (src/lib/analysis/quote-verifier.ts)
  │     └─ Türkçe karakter/noktalama toleranslı alıntı doğrulama; eşleşmeyenler ayıklanır
  └─ 9. Paylaşılabilir Kart PII Temizliği & Yanıt (Cache-Control: no-store)
```

## Klasör Yapısı

- `prompts/` — Koda gömülü olmayan Markdown sistem prompt'ları (`base.md`, tonlar ve `sectors/`)
- `src/app/api/roast/route.ts` — Tek analiz API uç noktası (multipart/form-data ve JSON destekli)
- `src/lib/privacy/pii-masker.ts` — Regex tabanlı KVKK kişisel veri maskeleme
- `src/lib/analysis/quote-verifier.ts` — Alıntı doğrulayıcı (halüsinasyon koruması)
- `src/lib/analysis/roast-service.ts` — Test edilebilir uçtan uca analiz servisi
- `src/lib/prompts/composer.ts` — Prompt dosyalarını okuyan ve delimiter ile birleştiren modül
- `src/lib/pdf/extract.ts` — Bellek içi PDF okuma ve boyut/tip/kelime sınırları
- `src/lib/llm/` — Ortak `LLMProvider` arayüzü ve Gemini / OpenAI / Anthropic adapter'ları
- `src/lib/security/rate-limit.ts` — Bellek içi IP başına hız sınırlayıcı
- `src/components/` — Türkçe UI bileşenleri ve istemci tarafı `<canvas>` PNG kart üreticisi

## Güvenlik ve Gizlilik Tasarım Kararları

- **Sıfır Kalıcılık:** Veritabanı yok, geçici dosya yazımı yok, CV veya LLM yanıtı loglaması yok.
- **BYOK İzolasyonu:** Kullanıcı anahtarı yalnızca ilgili HTTP isteğinin ömrü boyunca bellekte yaşar.
- **Doğrudan REST Adapter'ları:** LLM çağrıları standart `fetch` ve `x-goog-api-key` / `Authorization` / `x-api-key` başlıklarıyla yapılır; anahtarlar asla URL query parametrelerine konmaz.
- **Sıfır Harici İzleyici:** Analitik betiği veya harici font isteği yapılmaz.
