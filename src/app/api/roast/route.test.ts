import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRateLimiter } from '@/lib/security/rate-limit';
import { POST } from './route';

describe('POST /api/roast error logging and status mapping', () => {
  beforeEach(() => {
    defaultRateLimiter.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs provider, model, HTTP status, and upstream message without leaking API key, CV text, or prompt', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fakeSecretKey = 'DUMMY_BYOK_KEY_DO_NOT_LOG_987654321';
    const secretCvPhrase = 'GIZLI_CV_DENEYIM_SATIRI_XYZ123';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: 404,
            message: 'models/gemini-nonexistent is not found',
          },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const request = new Request('http://localhost:3000/api/roast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.0.1',
      },
      body: JSON.stringify({
        cvText: `KURGU ADAY\nDeneyim: ${secretCvPhrase} ve proje yönetimi deneyimi mevcuttur.`,
        tone: 'honest',
        sector: 'software',
        provider: 'gemini',
        model: 'gemini-nonexistent',
        apiKey: fakeSecretKey,
      }),
    });

    const response = await POST(request);
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(404);
    expect(body.error).toContain('modeli bulunamadı');
    expect(body.error).not.toContain(fakeSecretKey);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const loggedPayload = JSON.stringify(errorSpy.mock.calls[0]);
    expect(loggedPayload).toContain('gemini');
    expect(loggedPayload).toContain('gemini-nonexistent');
    expect(loggedPayload).toContain('404');
    expect(loggedPayload).toContain('models/gemini-nonexistent is not found');

    // Privacy assertions: key, CV text, and prompt must NEVER appear in logs
    expect(loggedPayload).not.toContain(fakeSecretKey);
    expect(loggedPayload).not.toContain(secretCvPhrase);
    expect(loggedPayload).not.toContain('CV_METNI_BASLANGIC');
  });
});
