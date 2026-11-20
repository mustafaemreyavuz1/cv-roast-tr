import {
  DEFAULT_MODELS,
  LLMError,
  mapUpstreamError,
  type LLMGenerateRequest,
  type LLMGenerateResponse,
  type LLMProvider,
} from './types';

interface GeminiResponseBody {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export class GeminiProvider implements LLMProvider {
  public readonly name = 'gemini' as const;
  public readonly model: string;
  private readonly apiKey: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model?.trim() || DEFAULT_MODELS.gemini;
  }

  public async generateJSON(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model
    )}:generateContent`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: request.systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: request.userPrompt }],
          },
        ],
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 4096,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      throw mapUpstreamError(this.name, response.status);
    }

    const data = (await response.json()) as GeminiResponseBody;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new LLMError('Gemini boş yanıt döndürdü. Lütfen tekrar deneyin.', this.name, 502);
    }

    return {
      text,
      provider: this.name,
      model: this.model,
    };
  }
}
