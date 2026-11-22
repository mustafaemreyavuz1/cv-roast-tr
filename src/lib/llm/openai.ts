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
    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
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
