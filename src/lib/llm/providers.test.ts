import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnthropicProvider } from './anthropic';
import { createLLMProvider } from './factory';
import { extractGeminiResponseText, GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import {
  DEFAULT_MODELS,
  GEMINI_FALLBACK_CHAIN,
  LLMError,
  mapUpstreamError,
  sanitizeUpstreamMessage,
} from './types';

describe('DEFAULT_MODELS & GEMINI_FALLBACK_CHAIN', () => {
  it('uses gemini-3.5-flash as default and defines the expected fallback chain', () => {
    expect(DEFAULT_MODELS.gemini).toBe('gemini-3.5-flash');
    expect(GEMINI_FALLBACK_CHAIN).toEqual([
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
    ]);
  });
});

describe('mapUpstreamError', () => {
  it('distinguishes 400, 401, 403, 404, 429, and 500 with appropriate Turkish messages', () => {
    const e400 = mapUpstreamError('gemini', 400, {
      model: 'gemini-3.5-flash',
      upstreamMessage: 'Invalid argument',
    });
    expect(e400.statusCode).toBe(400);
    expect(e400.upstreamStatus).toBe(400);
    expect(e400.model).toBe('gemini-3.5-flash');
    expect(e400.upstreamMessage).toBe('Invalid argument');
    expect(e400.message).toContain('400');

    const e401 = mapUpstreamError('openai', 401, { model: 'gpt-4o-mini' });
    expect(e401.statusCode).toBe(401);
    expect(e401.message).toContain('geçersiz');

    const e403 = mapUpstreamError('gemini', 403, { model: 'gemini-3.5-flash' });
    expect(e403.statusCode).toBe(403);
    expect(e403.message).toContain('yetkisi yok');

    const e404 = mapUpstreamError('anthropic', 404, { model: 'non-existent-model' });
    expect(e404.statusCode).toBe(404);
    expect(e404.message).toContain('modeli bulunamadı');

    const e429 = mapUpstreamError('gemini', 429, { model: 'gemini-3.5-flash' });
    expect(e429.statusCode).toBe(429);
    expect(e429.message).toContain('kota');

    const e500 = mapUpstreamError('openai', 503, { model: 'gpt-4o-mini' });
    expect(e500.statusCode).toBe(502);
    expect(e500.upstreamStatus).toBe(503);
    expect(e500.message).toContain('ulaşılamıyor');
  });
});

describe('sanitizeUpstreamMessage', () => {
  it('redacts accidental key patterns from upstream error messages', () => {
    const fakeGeminiKey = 'AIza' + 'FakeKey1234567890abcdefghij';
    const fakeOpenAiKey = 'sk-' + 'FakeOpenAiKey1234567890abcd';
    const msg = `Auth failed for ${fakeGeminiKey} and Bearer ${fakeOpenAiKey}`;
    const cleaned = sanitizeUpstreamMessage(msg);

    expect(cleaned).not.toContain(fakeGeminiKey);
    expect(cleaned).not.toContain(fakeOpenAiKey);
    expect(cleaned).toContain('[REDACTED_KEY]');
  });
});

describe('extractGeminiResponseText (Gemini 3.x thought parts)', () => {
  it('skips thought:true parts and joins all remaining text parts', () => {
    const text = extractGeminiResponseText({
      candidates: [
        {
          content: {
            parts: [
              { thought: true, text: 'Hmm, let me analyze this resume carefully...' },
              { text: '{"overallScore": ' },
              { thought: true, text: 'Double checking score...' },
              { text: '68, "verdict": "İyi deneme"}' },
            ],
          },
        },
      ],
    });

    expect(text).toBe('{"overallScore": 68, "verdict": "İyi deneme"}');
  });

  it('returns empty string when only thought parts are present', () => {
    const text = extractGeminiResponseText({
      candidates: [
        {
          content: {
            parts: [{ thought: true, text: 'Only internal thoughts' }],
          },
        },
      ],
    });

    expect(text).toBe('');
  });
});

describe('GeminiProvider fallback chain, thought handling, and timeout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back from 404 on gemini-3.5-flash to gemini-3.1-flash-lite and logs attempts safely', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const secretKey = 'DUMMY_SECRET_KEY_NOT_LOGGED';
    const secretPrompt = 'SENSITIVE_CV_CONTENT_XYZ';

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 404, message: 'Model not found' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    { thought: true, text: 'Thinking step...' },
                    { text: '{"overallScore": 72}' },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );

    const provider = new GeminiProvider(secretKey);
    const result = await provider.generateJSON({
      systemPrompt: 'sys',
      userPrompt: secretPrompt,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('gemini-3.5-flash');
    expect(String(fetchSpy.mock.calls[1]?.[0])).toContain('gemini-3.1-flash-lite');
    expect(result.model).toBe('gemini-3.1-flash-lite');
    expect(result.text).toBe('{"overallScore": 72}');

    // Ensure logs contain model & status codes, never key or prompt
    const allLogs = JSON.stringify(infoSpy.mock.calls);
    expect(allLogs).toContain('gemini-3.5-flash');
    expect(allLogs).toContain('404');
    expect(allLogs).toContain('gemini-3.1-flash-lite');
    expect(allLogs).toContain('200');
    expect(allLogs).not.toContain(secretKey);
    expect(allLogs).not.toContain(secretPrompt);
  });

  it('falls back through 404 -> 503 -> 200 to gemini-flash-lite-latest', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('Not found', { status: 404 }))
      .mockResolvedValueOnce(new Response('Service unavailable', { status: 503 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }],
          }),
          { status: 200 }
        )
      );

    const provider = new GeminiProvider('dummy-key');
    const result = await provider.generateJSON({ systemPrompt: 's', userPrompt: 'u' });

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(String(fetchSpy.mock.calls[2]?.[0])).toContain('gemini-flash-lite-latest');
    expect(result.model).toBe('gemini-flash-lite-latest');
  });

  it('triggers fallback chain on request timeout (AbortController)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementationOnce(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              const abortErr = new Error('The operation was aborted');
              abortErr.name = 'AbortError';
              reject(abortErr);
            });
          })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '{"recovered":true}' }] } }],
          }),
          { status: 200 }
        )
      );

    const provider = new GeminiProvider('dummy-key', undefined, {
      enableFallback: true,
      timeoutMs: 30,
    });
    const result = await provider.generateJSON({ systemPrompt: 's', userPrompt: 'u' });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.model).toBe('gemini-3.1-flash-lite');
    expect(result.text).toBe('{"recovered":true}');
    expect(JSON.stringify(warnSpy.mock.calls)).toContain('TIMEOUT');
  });

  it('throws clear Turkish error when all fallback models fail', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('Not found', { status: 404 }))
      .mockResolvedValueOnce(new Response('Too many requests', { status: 429 }))
      .mockResolvedValueOnce(new Response('Unavailable', { status: 503 }));

    const provider = new GeminiProvider('dummy-key');
    await expect(
      provider.generateJSON({ systemPrompt: 's', userPrompt: 'u' })
    ).rejects.toMatchObject({
      name: 'LLMError',
      provider: 'gemini',
      message: expect.stringContaining('Tüm yedek Gemini modelleri denendi'),
    });
  });

  it('does NOT use fallback chain when user explicitly chooses a model', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { code: 404, message: 'models/gemini-bad is not found for API version v1beta' },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const provider = createLLMProvider({
      provider: 'gemini',
      model: 'gemini-bad',
      apiKey: 'test-dummy-key',
    });

    await expect(
      provider.generateJSON({ systemPrompt: 'sys', userPrompt: 'usr' })
    ).rejects.toMatchObject({
      name: 'LLMError',
      provider: 'gemini',
      model: 'gemini-bad',
      statusCode: 404,
      upstreamStatus: 404,
      upstreamMessage: 'models/gemini-bad is not found for API version v1beta',
    } satisfies Partial<LLMError>);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});

describe('OpenAI & Anthropic upstream error handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('OpenAIProvider captures model, status, and upstream message on 401', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { message: 'Incorrect API key provided.' },
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const provider = new OpenAIProvider('test-dummy-key', 'gpt-4o-mini');
    await expect(
      provider.generateJSON({ systemPrompt: 'sys', userPrompt: 'usr' })
    ).rejects.toMatchObject({
      provider: 'openai',
      model: 'gpt-4o-mini',
      statusCode: 401,
      upstreamStatus: 401,
      upstreamMessage: 'Incorrect API key provided.',
    });
  });

  it('AnthropicProvider captures model, status, and upstream message on 429', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          type: 'error',
          error: { type: 'rate_limit_error', message: 'Number of request tokens has exceeded.' },
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const provider = new AnthropicProvider('test-dummy-key', 'claude-3-5-sonnet-latest');
    await expect(
      provider.generateJSON({ systemPrompt: 'sys', userPrompt: 'usr' })
    ).rejects.toMatchObject({
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-latest',
      statusCode: 429,
      upstreamStatus: 429,
      upstreamMessage: 'Number of request tokens has exceeded.',
    });
  });
});
