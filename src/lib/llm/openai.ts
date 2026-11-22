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

interface OpenAIResponseBody {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

export class OpenAIProvider implements LLMProvider {
  public readonly name = 'openai' as const;
  public readonly model: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(apiKey: string, model?: string, timeoutMs = DEFAULT_LLM_TIMEOUT_MS) {
    this.apiKey = apiKey;
    this.model = model?.trim() || DEFAULT_MODELS.openai;
    this.timeoutMs = timeoutMs;
  }

  public async generateJSON(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    let response: Response;
    try {
      response = await fetchWithTimeout(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? 4096,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: request.systemPrompt },
              { role: 'user', content: request.userPrompt },
            ],
          }),
        },
        this.timeoutMs
      );
    } catch (error) {
      const isTimeout = error instanceof LLMTimeoutError;
      const msg = error instanceof Error ? sanitizeUpstreamMessage(error.message) : 'Network error';
      console.warn('[llm/openai] attempt failed', {
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

    console.info('[llm/openai] attempt', {
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

    const data = (await response.json()) as OpenAIResponseBody;
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new LLMError('OpenAI boş yanıt döndürdü. Lütfen tekrar deneyin.', this.name, {
        statusCode: 502,
        model: this.model,
        upstreamStatus: response.status,
        upstreamMessage: 'Empty message content in response',
      });
    }

    return {
      text,
      provider: this.name,
      model: this.model,
    };
  }
}
