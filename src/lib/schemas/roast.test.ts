import { describe, expect, it } from 'vitest';
import {
  LLMProviderSchema,
  RoastOutputSchema,
  SectorModeSchema,
  ToneModeSchema,
} from './roast';

const validRoastOutput = {
  overallScore: 54,
  verdict: 'Potansiyel var ama klişelerin altında nefes alamıyor.',
  firstSixSeconds: {
    whatRecruiterSees: ['MS Office satırı', 'Gereksiz medeni hal bilgisi'],
    whatRecruiterMisses: ['Ölçülebilir proje çıktıları'],
    summary: 'İlk 6 saniyede güçlü yönler yerine klişeler öne çıkıyor.',
  },
  sectionCritiques: [
    {
      section: 'Deneyim',
      quote: 'Projelerde görev aldım.',
      issue: 'Katkı düzeyi belirsiz.',
      wittyComment: 'Görev almak yetmez, ne başardığını yaz.',
      concreteFix: 'Sonuç ve metrik ekle.',
      beforeAfter: {
        before: 'Projelerde görev aldım.',
        after: 'Ödeme akışını yenileyerek hata oranını %30 düşürdüm.',
      },
    },
  ],
  clicheDetector: [
    {
      phrase: 'takım çalışmasına yatkın',
      count: 1,
      suggestion: 'Somut bir ekip başarısı anlatın.',
    },
  ],
  turkeySpecificWarnings: [
    {
      category: 'Kişisel Bilgiler',
      warning: 'Medeni hal ve doğum tarihi gereksiz.',
      recommendation: 'Bu satırları tamamen kaldırın.',
    },
  ],
  topThreePriorities: [
    { title: 'Metrik ekle', impact: 'high' as const, action: 'Her role en az 2 sayısal sonuç yaz.' },
    { title: 'Klişeleri sil', impact: 'high' as const, action: 'MS Office satırını kaldır.' },
    { title: 'Özeti netleştir', impact: 'medium' as const, action: '2 cümlelik değer önerisi yaz.' },
  ],
  shareableCard: {
    score: 54,
    funniestLine: 'Klişe oranı o kadar yüksek ki işe alımcı kahve molasını erkene aldı.',
  },
};

describe('Roast Zod Schemas', () => {
  it('validates a complete RoastOutput without jobMatch', () => {
    const parsed = RoastOutputSchema.safeParse(validRoastOutput);
    expect(parsed.success).toBe(true);
  });

  it('validates a RoastOutput with jobMatch included', () => {
    const parsed = RoastOutputSchema.safeParse({
      ...validRoastOutput,
      jobMatch: {
        matchScore: 72,
        missingKeywords: ['TypeScript', 'Docker'],
        mismatches: ['İlanda 3+ yıl deneyim isteniyor, CV 1 yıl gösteriyor.'],
        summary: 'Teknik temel uyumlu ama eksik anahtar kelimeler var.',
      },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects out-of-range overallScore', () => {
    expect(
      RoastOutputSchema.safeParse({ ...validRoastOutput, overallScore: 105 }).success
    ).toBe(false);
    expect(
      RoastOutputSchema.safeParse({ ...validRoastOutput, overallScore: -1 }).success
    ).toBe(false);
  });

  it('validates tone, sector, and provider enums', () => {
    expect(ToneModeSchema.safeParse('brutal').success).toBe(true);
    expect(ToneModeSchema.safeParse('sarcastic').success).toBe(false);

    expect(SectorModeSchema.safeParse('software').success).toBe(true);
    expect(SectorModeSchema.safeParse('unknown').success).toBe(false);

    expect(LLMProviderSchema.safeParse('gemini').success).toBe(true);
    expect(LLMProviderSchema.safeParse('openai').success).toBe(true);
    expect(LLMProviderSchema.safeParse('anthropic').success).toBe(true);
    expect(LLMProviderSchema.safeParse('invalid').success).toBe(false);
  });
});
