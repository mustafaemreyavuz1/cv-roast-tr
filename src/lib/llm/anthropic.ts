import {
  DEFAULT_MODELS,
  LLMError,
  mapUpstreamError,
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
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!response.ok) {
      throw mapUpstreamError(this.name, response.status);
    }

    const data = (await response.json()) as AnthropicResponseBody;
    const text = data.content?.find((block) => block.type === 'text')?.text;

    if (!text) {
      throw new LLMError('Anthropic boş yanıt döndürdü. Lütfen tekrar deneyin.', this.name, 502);
    }

    return {
      text,
      provider: this.name,
      model: this.model,
    };
  }
}
