import { describe, expect, it } from 'vitest';
import type { RoastOutput } from '@/lib/schemas/roast';
import {
  applyHallucinationGuard,
  isQuoteInCV,
  normalizeForQuoteMatch,
  verifyCritiqueQuotes,
} from './quote-verifier';

describe('normalizeForQuoteMatch', () => {
  it('normalizes Turkish characters, casing, punctuation, and whitespace', () => {
    const a = normalizeForQuoteMatch('İSTANBUL’da,   Şirket-içi  Çalışma & Öğrenme!');
    const b = normalizeForQuoteMatch('istanbulda sirket ici calisma ogrenme');
    expect(a).toBe(b);
  });
});

describe('isQuoteInCV', () => {
  const sampleCv = `
    Kariyer Hedefi
    Takım çalışmasına yatkın, stres altında çalışabilen ve MS Office (Word, Excel) bilen bir mühendisim.
    Şirket içi web projelerinde görev aldım.
  `;

  it('matches exact quotes', () => {
    expect(isQuoteInCV('Şirket içi web projelerinde görev aldım.', sampleCv)).toBe(true);
  });

  it('tolerates case, whitespace, Turkish character, and punctuation differences', () => {
    expect(isQuoteInCV('TAKIM CALISMASINA YATKIN stres altinda calisabilen', sampleCv)).toBe(true);
    expect(isQuoteInCV('“MS Office Word Excel bilen”', sampleCv)).toBe(true);
  });

  it('rejects fabricated quotes not present in CV', () => {
    expect(isQuoteInCV('Kubernetes kümesi yönettim ve %99.9 SLA sağladım', sampleCv)).toBe(false);
  });

  it('rejects empty or trivially short quotes', () => {
    expect(isQuoteInCV('', sampleCv)).toBe(false);
    expect(isQuoteInCV('ve', sampleCv)).toBe(false);
  });
});

describe('applyHallucinationGuard', () => {
  it('filters out critiques with unverified quotes while keeping verified ones', () => {
    const cvText = 'Deneyim: Şirket içi projelerde görev aldım. Yetenekler: MS Office bilgisi.';

    const mockOutput: RoastOutput = {
      overallScore: 45,
      verdict: 'Klişe dolu bir CV.',
      firstSixSeconds: {
        whatRecruiterSees: ['MS Office'],
        whatRecruiterMisses: ['Somut etki'],
        summary: 'Özet',
      },
      sectionCritiques: [
        {
          section: 'Deneyim',
          quote: 'Şirket içi projelerde görev aldım',
          issue: 'Belirsiz ifade.',
          wittyComment: 'Hangi proje?',
          concreteFix: 'Metrik ekle.',
          beforeAfter: { before: 'Görev aldım', after: 'X projesini geliştirdim' },
        },
        {
          section: 'Özet',
          quote: '10 yıl Fortune 500 deneyimine sahibim',
          issue: 'Halüsinasyon alıntı.',
          wittyComment: 'Uydurma.',
          concreteFix: 'Yok.',
          beforeAfter: { before: 'A', after: 'B' },
        },
      ],
      clicheDetector: [],
      turkeySpecificWarnings: [],
      topThreePriorities: [{ title: 'Metrik ekle', impact: 'high', action: 'Sayı yaz' }],
      shareableCard: { score: 45, funniestLine: 'Komik bir cümle.' },
    };

    const { sanitizedOutput, verifiedCount, filteredCount } = applyHallucinationGuard(
      mockOutput,
      cvText
    );

    expect(verifiedCount).toBe(1);
    expect(filteredCount).toBe(1);
    expect(sanitizedOutput.sectionCritiques).toHaveLength(1);
    expect(sanitizedOutput.sectionCritiques[0]?.quote).toBe('Şirket içi projelerde görev aldım');

    const direct = verifyCritiqueQuotes(mockOutput.sectionCritiques, cvText);
    expect(direct.rejectedCritiques).toHaveLength(1);
  });
});
