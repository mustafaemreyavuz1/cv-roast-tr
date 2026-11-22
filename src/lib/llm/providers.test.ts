import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { LLMError, mapUpstreamError, sanitizeUpstreamMessage } from './types';

describe('mapUpstreamError', () => {
  it('distinguishes 400, 401, 403, 404, 429, and 500 with appropriate Turkish messages', () => {
    const e400 = mapUpstreamError('gemini', 400, {
      model: 'gemini-2.5-flash',
      upstreamMessage: 'Invalid argument',
    });
    expect(e400.statusCode).toBe(400);
    expect(e400.upstreamStatus).toBe(400);
    expect(e400.model).toBe('gemini-2.5-flash');
    expect(e400.upstreamMessage).toBe('Invalid argument');
    expect(e400.message).toContain('400');

    const e401 = mapUpstreamError('openai', 401, { model: 'gpt-4o-mini' });
    expect(e401.statusCode).toBe(401);
    expect(e401.message).toContain('geçersiz');

    const e403 = mapUpstreamError('gemini', 403, { model: 'gemini-2.5-flash' });
    expect(e403.statusCode).toBe(403);
    expect(e403.message).toContain('yetkisi yok');

    const e404 = mapUpstreamError('anthropic', 404, { model: 'non-existent-model' });
    expect(e404.statusCode).toBe(404);
    expect(e404.message).toContain('modeli bulunamadı');

    const e429 = mapUpstreamError('gemini', 429, { model: 'gemini-2.5-flash' });
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

describe('LLM providers upstream error handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GeminiProvider captures model, status, and upstream message on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: { code: 404, message: 'models/gemini-bad is not found for API version v1beta' },
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const provider = new GeminiProvider('test-dummy-key', 'gemini-bad');
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
  });

  it('OpenAIProvider captures model, status, and upstream message on 401', async () => {
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
