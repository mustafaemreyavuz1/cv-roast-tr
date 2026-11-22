# CV Roast TR 🔥

> **🛡️ Gizlilik ve KVKK Notu (Önce Okuyun):**
> - Yüklediğiniz PDF dosyası veya yapıştırdığınız CV metni **hiçbir zaman diske yazılmaz, veritabanına kaydedilmez ve sunucu loglarına düşülmez**.
> - CV metni yapay zeka sağlayıcısına gönderilmeden önce **e-posta, telefon (Türkiye formatları dahil), TC kimlik no, IBAN, profil linkleri ve açık adres kalıpları** sunucu tarafında otomatik olarak maskelenir (`[E-POSTA]`, `[TELEFON]`, `[TC-KIMLIK]`, `[IBAN]`, `[BAGLANTI]`, `[ADRES]`).
> - Uygulamada hiçbir analitik, çerez izleyici veya üçüncü parti takip kodu bulunmaz.
> - Kendi API anahtarınızı (**Bring Your Own Key**) girerseniz anahtar yalnızca o tek isteğin süresince bellekte kullanılır; saklanmaz ve loglanmaz.

**CV Roast TR**, Türkçe CV'leri acımasız ama adil bir işe alım yöneticisi gözüyle analiz eden; esprili üslubunun yanında **her eleştiri için somut düzeltme ve önce/sonra örneği** sunan açık kaynak bir web uygulamasıdır.

Klasik ATS araçlarının aksine pohpohlamaz. Türkiye iş piyasasına özgü CV alışkanlıklarını (vesikalık fotoğraf, doğum tarihi, medeni hal, askerlik durumu, "MS Office bilgisi", "takım çalışmasına yatkın", "Referanslar: İstenildiğinde sunulacaktır" vb.) yakından bilir.

---

## ✨ Özellikler

- **3 Ton Modu:** Nazik (yapıcı mentor), Dürüst (net işe alım yöneticisi) ve Acımasız (tam roast). Tüm prompt'lar koddan ayrı `prompts/` klasöründe tutulur.
- **6 Sektör Modu:** Genel, Yazılım, Pazarlama, Finans, Mühendislik, Tasarım — her sektörün kendi beklenti prompt'u `prompts/sectors/` altındadır.
- **PDF + Düz Metin Desteği:** PDF dosyaları sunucu tarafında yalnızca bellekte okunur (maks. 5 MB, 6.000 kelime); PDF yüklemeden düz metin yapıştırarak da çalışır.
- **Opsiyonel Hedef İş İlanı Uyum Analizi:** İş ilanı metni eklendiğinde uyum skoru, eksik anahtar kelimeler ve uyumsuzluklar raporlanır.
- **Halüsinasyon Koruması:** Yapay zekanın ürettiği her CV alıntısı, Türkçe karakterlere ve noktalama farklarına toleranslı eşleştiriciyle CV metninde doğrulanır; uydurma alıntılar çıktıdan ayıklanır.
- **Prompt Injection Koruması:** CV ve ilan metni kesin sınırlandırıcılarla (`<<<CV_METNI_BASLANGIC>>>`) veri olarak izole edilir.
- **Paylaşılabilir Roast Kartı (PNG):** Yalnızca skor, ton ve kişisel veri içermeyen tek esprili cümleyi barındıran, tarayıcıda üretilip indirilebilen PNG kart.
- **Provider-Agnostic LLM Katmanı + BYOK:** Varsayılan olarak **Google Gemini**, ayrıca **OpenAI** ve **Anthropic Claude** desteği.

---

## 📸 Ekran Görüntüsü

> _Ekran görüntüsü yer tutucusu: Uygulama yerelde çalıştırıldıktan sonra buraya ana ekran ve analiz sonucu görselleri eklenecektir._
>
> `![CV Roast TR Ekran Görüntüsü](docs/screenshot-placeholder.png)`

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 20+ ve npm
- Gemini, OpenAI veya Anthropic API anahtarı (sunucu `.env.local` dosyasında veya arayüzdeki BYOK alanından)

### Adımlar

```bash
git clone https://github.com/<kullanici-adin>/cv-roast-tr.git
cd cv-roast-tr
npm install
cp .env.example .env.local
```

`.env.local` dosyasını açıp seçtiğiniz sağlayıcının anahtarını ekleyin ve geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresine gidin.

---

## ⚙️ Ortam Değişkenleri (`.env`)

Tüm değişkenlerin şablonu `.env.example` dosyasındadır:

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `LLM_PROVIDER` | `gemini` | Kullanılacak sağlayıcı: `gemini`, `openai` veya `anthropic` |
| `LLM_MODEL` | Sağlayıcı varsayılanı | Opsiyonel model adı (`gemini-3.5-flash`, `gpt-4o-mini`, `claude-3-5-sonnet-latest`) |
| `GEMINI_API_KEY` | — | Google Gemini API anahtarı |
| `OPENAI_API_KEY` | — | OpenAI API anahtarı |
| `ANTHROPIC_API_KEY` | — | Anthropic API anahtarı |
| `RATE_LIMIT_MAX_REQUESTS` | `10` | IP başına zaman penceresindeki maksimum istek sayısı |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit penceresi (milisaniye) |

---

## 🧪 Komutlar

```bash
npm run lint       # ESLint kontrolü
npm run typecheck  # TypeScript strict tip kontrolü
npm test           # Vitest birim testleri (gerçek API anahtarı gerekmez)
npm run build      # Next.js üretim derlemesi
```

---

## 📝 Prompt'lara Katkı Rehberi

Prompt'lar koda gömülü değildir; doğrudan Markdown dosyalarını düzenleyerek iyileştirme yapabilirsiniz:

- `prompts/base.md` — Ortak işe alım kuralları, prompt injection savunması, Türkiye bağlamı ve JSON şeması
- `prompts/gentle.md`, `prompts/honest.md`, `prompts/brutal.md` — Ton modları
- `prompts/sectors/*.md` — Sektöre özel beklentiler

Yeni bir ton veya sektör eklemek için ayrıntılı adımlar [CONTRIBUTING.md](CONTRIBUTING.md) dosyasında yer alır.

---

## 🗺️ Yol Haritası

- [ ] DOCX dosya desteği (bellek içi metin çıkarma)
- [ ] Kişisel veri maskeleme önizlemesi (kullanıcı LLM'e gidecek maskelenmiş metni göndermeden önce görebilsin)
- [ ] Yeni sektör prompt'ları (Hukuk, Sağlık, Akademi, Satış)
- [ ] CV versiyon karşılaştırma (düzeltme öncesi vs. sonrası skor farkı)
- [ ] İngilizce CV'ler için opsiyonel uluslararası standart modu

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.
