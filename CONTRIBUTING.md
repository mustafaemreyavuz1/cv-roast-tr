# CV Roast TR Katkı Rehberi

CV Roast TR'ye katkı sunmak istediğiniz için teşekkürler! Bu rehber özellikle yeni **ton** ve **sektör** prompt'ları ekleme ile kod katkısı standartlarını açıklar.

## Temel İlkeler

1. **Gizlilik kırmızı çizgidir:** CV metnini, LLM yanıtını veya kullanıcı API anahtarlarını loglayan, diske yazan ya da üçüncü parti izleyici ekleyen değişiklikler kabul edilmez.
2. **Gerçek kişi verisi yasaktır:** Testlerde ve `examples/` klasöründe yalnızca tamamen kurgusal adlar, sahte e-postalar (`@example.com`) ve geçersiz/kurgusal numaralar kullanın.
3. **Eleştiri + somut çözüm dengesi:** Prompt katkılarında mizah keskin olabilir, ancak kişisel hakaret/ayrımcılık içeremez ve her eleştiri somut bir düzeltme önerisiyle eşleşmelidir.

---

## Mevcut Bir Prompt'u İyileştirme

Prompt dosyaları `prompts/` klasöründedir ve koda gömülü değildir:
- `prompts/base.md`: Ortak sistem kuralları, prompt injection savunması ve JSON şeması
- `prompts/gentle.md`, `prompts/honest.md`, `prompts/brutal.md`: Ton modları
- `prompts/sectors/*.md`: Sektör modları

Dosyayı düzenledikten sonra `npm test` çalıştırarak prompt birleştirici testlerinin geçtiğini doğrulayın.

---

## Yeni Bir Sektör Prompt'u Ekleme

Örneğin `legal` (Hukuk) sektörünü eklemek için:

1. `prompts/sectors/legal.md` dosyasını oluşturun ve sektöre özgü işe alım beklentilerini, yaygın klişeleri ve beklenen metrikleri net maddelerle yazın.
2. `src/lib/schemas/roast.ts` içindeki `SECTOR_MODES` dizisine `'legal'` değerini ve `SECTOR_LABELS` nesnesine `'Hukuk'` etiketini ekleyin.
3. `src/lib/prompts/composer.test.ts` testlerini çalıştırıp yeni sektörün doğru yüklendiğini doğrulayın.

## Yeni Bir Ton Modu Ekleme

1. `prompts/<ton-adi>.md` dosyasını oluşturun.
2. `src/lib/schemas/roast.ts` içindeki `TONE_MODES` ve `TONE_LABELS` tanımlarını güncelleyin.
3. Gerekirse `src/lib/analysis/roast-service.ts` içindeki `temperature` ayarını gözden geçirin.

---

## Pull Request Kontrol Listesi

PR açmadan önce aşağıdaki komutların tamamının hatasız geçtiğinden emin olun:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Commit mesajlarında [Conventional Commits](https://www.conventionalcommits.org/) biçimini kullanın (ör. `feat: add legal sector prompt`, `fix: improve turkish phone masking`).
