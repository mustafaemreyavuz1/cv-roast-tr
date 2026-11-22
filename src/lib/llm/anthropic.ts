import {
  DEFAULT_LLM_TIMEOUT_MS,
  DEFAULT_MODELS,
  extractUpstreamErrorMessage,
  fetchWithTimeout,
  LLMError,
  LLMTimeoutError,
  mapUpstreamError,
  sanitizeUpstreamMessage,
  type LLMGenerateRequest,
  type LLMGenerateResponse,
  type LLMProvider,
} from './types';

interface AnthropicResponseBody {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
}

export class AnthropicProvider implements LLMProvider {
  public readonly name = 'anthropic' as const;
  public readonly model: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(apiKey: string, model?: string, timeoutMs = DEFAULT_LLM_TIMEOUT_MS) {
    this.apiKey = apiKey;
    this.model = model?.trim() || DEFAULT_MODELS.anthropic;
    this.timeoutMs = timeoutMs;
  }

  public async generateJSON(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    let response: Response;
    try {
      response = await fetchWithTimeout(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: request.maxTokens ?? 4096,
            temperature: request.temperature ?? 0.7,
            system: request.systemPrompt,
            messages: [{ role: 'user', content: request.userPrompt }],
          }),
        },
        this.timeoutMs
      );
    } catch (error) {
      const isTimeout = error instanceof LLMTimeoutError;
      const msg = error instanceof Error ? sanitizeUpstreamMessage(error.message) : 'Network error';
      console.warn('[llm/anthropic] attempt failed', {
        provider: this.name,
        model: this.model,
        httpStatus: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      });
      throw new LLMError(
        isTimeout
          ? 'Yapay zeka servisi 45 saniye içinde yanıt vermedi (zaman aşımı). Lütfen tekrar deneyin.'
          : 'Yapay zeka servisine şu anda ulaşılamıyor. Lütfen birkaç saniye sonra tekrar deneyin.',
        this.name,
        { statusCode: isTimeout ? 504 : 502, model: this.model, upstreamMessage: msg }
      );
    }

    console.info('[llm/anthropic] attempt', {
      provider: this.name,
      model: this.model,
      httpStatus: response.status,
    });

    if (!response.ok) {
      const upstreamMessage = await extractUpstreamErrorMessage(response);
      throw mapUpstreamError(this.name, response.status, {
        model: this.model,
        upstreamMessage,
      });
    }

    const data = (await response.json()) as AnthropicResponseBody;
    const text = data.content?.find((block) => block.type === 'text')?.text;

    if (!text) {
      throw new LLMError('Anthropic boş yanıt döndürdü. Lütfen tekrar deneyin.', this.name, {
        statusCode: 502,
        model: this.model,
        upstreamStatus: response.status,
        upstreamMessage: 'Empty text block in response',
      });
    }

    return {
      text,
      provider: this.name,
      model: this.model,
    };
  }
}
