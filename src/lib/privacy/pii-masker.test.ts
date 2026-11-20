import { describe, expect, it } from 'vitest';
import { maskPII } from './pii-masker';

describe('maskPII', () => {
  it('masks email addresses', () => {
    const input = 'İletişim: test.kullanici+cv@ornek-domain.com.tr ve ikinci@example.org';
    const { maskedText, stats } = maskPII(input);

    expect(maskedText).toBe('İletişim: [E-POSTA] ve [E-POSTA]');
    expect(stats.emails).toBe(2);
    expect(stats.total).toBe(2);
  });

  it('masks various Turkish phone number formats', () => {
    const formats = [
      '+90 532 123 45 67',
      '+905321234567',
      '0090 555 111 22 33',
      '0 (532) 123-45-67',
      '0532 123 45 67',
      '05321234567',
      '0 212 444 55 66',
      '532-123-45-67',
    ];

    for (const phone of formats) {
      const { maskedText, stats } = maskPII(`Telefon: ${phone}`);
      expect(maskedText, `Failed for format: ${phone}`).toBe('Telefon: [TELEFON]');
      expect(stats.phones, `Stats failed for format: ${phone}`).toBe(1);
    }
  });

  it('masks 11-digit TC Kimlik No without touching years or shorter numbers', () => {
    const input = 'TC Kimlik: 12345678901 | Doğum Yılı: 1998 | Deneyim: 5 yıl';
    const { maskedText, stats } = maskPII(input);

    expect(maskedText).toBe('TC Kimlik: [TC-KIMLIK] | Doğum Yılı: 1998 | Deneyim: 5 yıl');
    expect(stats.tcKimlik).toBe(1);
  });

  it('masks Turkish IBAN with or without spaces and does not confuse it with phone/TC', () => {
    const input = 'IBAN: TR33 0006 1005 1978 6457 8413 26 ve TR330006100519786457841326';
    const { maskedText, stats } = maskPII(input);

    expect(maskedText).toBe('IBAN: [IBAN] ve [IBAN]');
    expect(stats.ibans).toBe(2);
    expect(stats.phones).toBe(0);
    expect(stats.tcKimlik).toBe(0);
  });

  it('masks URLs and social/portfolio profile links while preserving trailing punctuation', () => {
    const input =
      'Portföy: https://ornek-site.com/cv, GitHub: github.com/kurgu-aday. LinkedIn: www.linkedin.com/in/kurgu-aday.';
    const { maskedText, stats } = maskPII(input);

    expect(maskedText).toBe(
      'Portföy: [BAGLANTI], GitHub: [BAGLANTI]. LinkedIn: [BAGLANTI].'
    );
    expect(stats.urls).toBe(3);
  });

  it('masks Turkish open address patterns', () => {
    const input = [
      'Adres: Moda Mah. Bahariye Cad. No: 14 Kat: 3 D: 6 Kadıköy/İstanbul',
      'Atatürk Mahallesi Cumhuriyet Bulvarı No: 25 Çankaya / Ankara',
      'Yıldız Sitesi No: 8 Kat: 4 Daire: 12',
    ].join('\n');

    const { maskedText, stats } = maskPII(input);

    expect(maskedText).toContain('Adres: [ADRES]');
    expect(maskedText).not.toContain('Bahariye');
    expect(maskedText).not.toContain('Cumhuriyet Bulvarı');
    expect(maskedText).not.toContain('Yıldız Sitesi');
    expect(stats.addresses).toBe(3);
  });

  it('preserves regular CV content and city-only mentions', () => {
    const input = 'İstanbul — Senior Backend Developer (2021 - 2025)\nAPI yanıt süresini %40 azalttım.';
    const { maskedText, stats } = maskPII(input);

    expect(maskedText).toBe(input);
    expect(stats.total).toBe(0);
  });

  it('handles empty string cleanly', () => {
    const { maskedText, stats } = maskPII('');
    expect(maskedText).toBe('');
    expect(stats.total).toBe(0);
  });
});
