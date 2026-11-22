import {
  DEFAULT_MODELS,
  extractUpstreamErrorMessage,
  LLMError,
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

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model?.trim() || DEFAULT_MODELS.anthropic;
  }

  public async generateJSON(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
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
        signal: AbortSignal.timeout(45_000),
      });
    } catch (error) {
      const msg = error instanceof Error ? sanitizeUpstreamMessage(error.message) : 'Network error';
      throw new LLMError(
        'Yapay zeka servisine şu anda ulaşılamıyor. Lütfen birkaç saniye sonra tekrar deneyin.',
        this.name,
        { statusCode: 502, model: this.model, upstreamMessage: msg }
      );
    }

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
