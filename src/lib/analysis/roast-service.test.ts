import { describe, expect, it, vi } from 'vitest';
import type { LLMGenerateRequest, LLMProvider } from '@/lib/llm';
import { InMemoryRateLimiter } from '@/lib/security/rate-limit';
import { runRoastAnalysis } from './roast-service';

describe('runRoastAnalysis (with mocked LLM)', () => {
  it('masks PII before sending to LLM, verifies quotes, and scrubs shareableCard', async () => {
    let capturedPrompt = '';

    const mockProvider: LLMProvider = {
      name: 'gemini',
      model: 'mock-gemini',
      generateJSON: vi.fn(async (req: LLMGenerateRequest) => {
        capturedPrompt = req.userPrompt;
        return {
          provider: 'gemini' as const,
          model: 'mock-gemini',
          text: JSON.stringify({
            overallScore: 42,
            verdict: 'Klişeler CV’yi ele geçirmiş.',
            firstSixSeconds: {
              whatRecruiterSees: ['MS Office bilgisi'],
              whatRecruiterMisses: ['Ölçülebilir başarılar'],
              summary: 'İlk bakışta somut etki görünmüyor.',
            },
            sectionCritiques: [
              {
                section: 'Yetenekler',
                quote: 'MS Office bilgisi ve takım çalışmasına yatkın',
                issue: 'Çok genel klişe.',
                wittyComment: 'Word bilmek 2026’da süper güç değil.',
                concreteFix: 'Somut araç ve sonuç yazın.',
                beforeAfter: {
                  before: 'MS Office bilgisi',
                  after: 'Excel makro ve Power BI ile haftalık KPI raporlaması',
                },
              },
              {
                section: 'Deneyim',
                quote: 'Bu cümle CV metninde kesinlikle yok',
                issue: 'Halüsinasyon.',
                wittyComment: 'Ayıklanmalı.',
                concreteFix: 'Ayıklanmalı.',
                beforeAfter: { before: 'A', after: 'B' },
              },
            ],
            clicheDetector: [
              { phrase: 'takım çalışmasına yatkın', count: 1, suggestion: 'Örnek verin.' },
            ],
            turkeySpecificWarnings: [],
            topThreePriorities: [
              { title: 'Klişeleri çıkar', impact: 'high', action: 'MS Office satırını sil.' },
            ],
            shareableCard: {
              score: 99, // intentionally mismatched to test sync with overallScore
              funniestLine: 'İletişim için gizli@ornek.com adresine gerek yok, klişeler zaten bağırıyor.',
            },
          }),
        };
      }),
    };

    const rawCv = `
      KURGU ADAY
      E-posta: gizli@ornek.com
      Telefon: +90 532 111 22 33
      TC Kimlik: 12345678901
      Yetenekler: MS Office bilgisi ve takım çalışmasına yatkın.
    `;

    const response = await runRoastAnalysis({
      rawCvText: rawCv,
      tone: 'brutal',
      sector: 'general',
      provider: mockProvider,
    });

    // 1. Raw PII never reached the LLM
    expect(capturedPrompt).not.toContain('gizli@ornek.com');
    expect(capturedPrompt).not.toContain('532 111 22 33');
    expect(capturedPrompt).not.toContain('12345678901');
    expect(capturedPrompt).toContain('[E-POSTA]');
    expect(capturedPrompt).toContain('[TELEFON]');
    expect(capturedPrompt).toContain('[TC-KIMLIK]');

    // 2. Hallucinated quote was filtered out
    expect(response.result.sectionCritiques).toHaveLength(1);
    expect(response.meta.verifiedQuotesCount).toBe(1);
    expect(response.meta.filteredHallucinatedQuotesCount).toBe(1);

    // 3. Shareable card score synced & PII scrubbed
    expect(response.result.shareableCard.score).toBe(42);
    expect(response.result.shareableCard.funniestLine).not.toContain('gizli@ornek.com');
    expect(response.result.shareableCard.funniestLine).toContain('[E-POSTA]');
  });
});

describe('InMemoryRateLimiter', () => {
  it('blocks requests over the limit and recovers after window passes', () => {
    const limiter = new InMemoryRateLimiter({ maxRequests: 2, windowMs: 10_000 });
    const t0 = 1_000_000;

    expect(limiter.check('1.2.3.4', t0).allowed).toBe(true);
    expect(limiter.check('1.2.3.4', t0 + 1000).allowed).toBe(true);

    const blocked = limiter.check('1.2.3.4', t0 + 2000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

    // Different IP is unaffected
    expect(limiter.check('5.6.7.8', t0 + 2000).allowed).toBe(true);

    // After window expires, original IP is allowed again
    expect(limiter.check('1.2.3.4', t0 + 11_000).allowed).toBe(true);
  });
});
