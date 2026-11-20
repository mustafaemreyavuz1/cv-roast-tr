import type { SectorMode } from '@/lib/schemas/roast';

export interface SampleCvPreset {
  id: string;
  label: string;
  sector: SectorMode;
  text: string;
}

export const SAMPLE_CV_PRESETS: SampleCvPreset[] = [
  {
    id: 'junior-dev',
    label: 'Örnek: Junior Yazılımcı (Klişe Dolu)',
    sector: 'software',
    text: `KURGU ADAY
Yazılım Geliştirici (Fotoğraf: Vesikalık eklendi)

Kişisel Bilgiler
Doğum Tarihi: 01.01.2000
Medeni Hal: Bekar
Askerlik Durumu: Tecilli (2028)
Ehliyet: B Sınıfı
E-posta: kurgu.aday@example.com
Telefon: +90 555 000 00 00
Adres: Örnek Mah. Deneme Cad. No: 10 Kat: 2 Daire: 4 Kadıköy/İstanbul

Kariyer Hedefi
Kendimi sürekli geliştirebileceğim, dinamik ve kurumsal bir firmada takım çalışmasına yatkın, sorumluluk sahibi ve stres altında çalışabilen bir yazılım mühendisi olarak görev almak istiyorum.

Deneyim
Örnek Yazılım A.Ş. — Junior Software Developer (2024 - Günümüz)
- Şirket içi web projelerinde görev aldım.
- Frontend ve backend geliştirmelerine destek verdim.
- Hataları çözdüm ve toplantılara katıldım.

Eğitim
Örnek Üniversitesi — Bilgisayar Mühendisliği (2019 - 2023)

Yetenekler
MS Office (Word, Excel, PowerPoint - Çok İyi), HTML, CSS, JavaScript, React, Node.js, Python, Java, C++, Docker, Kubernetes, Yapay Zeka

Yabancı Dil
İngilizce: Orta-İyi

Referanslar
İstenildiğinde sunulacaktır.`,
  },
  {
    id: 'marketing',
    label: 'Örnek: Dijital Pazarlama',
    sector: 'marketing',
    text: `DENEME KULLANICI
Dijital Pazarlama Uzmanı

İletişim
E-posta: deneme.pazarlama@example.com
Telefon: 0 (555) 111-22-33

Özet
İletişim becerileri güçlü, öğrenmeye açık, sonuç odaklı ve yaratıcı bir pazarlama uzmanıyım. Sosyal medyayı yakından takip ediyorum ve yeni trendlere hızla uyum sağlıyorum.

İş Deneyimi
Kurgusal Ajans — Sosyal Medya ve Pazarlama Uzmanı (2022 - 2025)
- Markaların Instagram ve LinkedIn hesaplarını yönettim.
- Reklam kampanyaları oluşturdum ve takip ettim.
- Aylık raporlar hazırladım ve müşterilere sundum.

Eğitim
Kurgusal Üniversitesi — İşletme (2017 - 2021)

Yetkinlikler
MS Office, Canva, Meta Business Suite, Google Ads, SEO, Takım Çalışmasına Yatkınlık, Zaman Yönetimi

Referanslar
Talep edilmesi halinde paylaşılacaktır.`,
  },
];
