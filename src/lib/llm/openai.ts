import {
  DEFAULT_MODELS,
  LLMError,
  mapUpstreamError,
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

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model?.trim() || DEFAULT_MODELS.openai;
  }

  public async generateJSON(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      throw mapUpstreamError(this.name, response.status);
    }

    const data = (await response.json()) as OpenAIResponseBody;
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new LLMError('OpenAI boş yanıt döndürdü. Lütfen tekrar deneyin.', this.name, 502);
    }

    return {
      text,
      provider: this.name,
      model: this.model,
    };
  }
}
