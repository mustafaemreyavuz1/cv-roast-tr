import {
  DEFAULT_LLM_TIMEOUT_MS,
  DEFAULT_MODELS,
  extractUpstreamErrorMessage,
  fetchWithTimeout,
  GEMINI_FALLBACK_CHAIN,
  LLMError,
  LLMTimeoutError,
  mapUpstreamError,
  sanitizeUpstreamMessage,
  type LLMGenerateRequest,
  type LLMGenerateResponse,
  type LLMProvider,
} from './types';

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponseBody {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
}

export interface GeminiProviderOptions {
  /** Whether to fall back through GEMINI_FALLBACK_CHAIN on 404/429/503/network/timeout. */
  enableFallback?: boolean;
  /** Per-request timeout in ms (default 45,000ms). */
  timeoutMs?: number;
}

const FALLBACK_STATUS_CODES = new Set([404, 429, 503]);

/**
 * Extracts non-thought text parts from Gemini 3.x responses.
 * Skips any part with `thought: true` and joins the remaining text parts.
 */
export function extractGeminiResponseText(data: GeminiResponseBody): string {
  const parts = data.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    return '';
  }

  return parts
    .filter((part) => part.thought !== true && typeof part.text === 'string')
    .map((part) => part.text as string)
    .join('')
    .trim();
}

export class GeminiProvider implements LLMProvider {
  public readonly name = 'gemini' as const;
  public readonly model: string;
  private readonly apiKey: string;
  private readonly candidateModels: string[];
  private readonly timeoutMs: number;

  constructor(apiKey: string, model?: string, options?: GeminiProviderOptions) {
    this.apiKey = apiKey;
    const trimmedModel = model?.trim();
    this.model = trimmedModel || DEFAULT_MODELS.gemini;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_LLM_TIMEOUT_MS;

    // Default behavior: fallback enabled when no explicit model is passed, disabled when explicit model is passed.
    const enableFallback = options?.enableFallback ?? !trimmedModel;

    if (enableFallback) {
      const chain = [this.model, ...GEMINI_FALLBACK_CHAIN];
      this.candidateModels = Array.from(new Set(chain));
    } else {
      this.candidateModels = [this.model];
    }
  }

  public async generateJSON(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    let lastError: LLMError | null = null;
    const totalAttempts = this.candidateModels.length;

    for (let idx = 0; idx < totalAttempts; idx += 1) {
      const candidateModel = this.candidateModels[idx] as string;
      const hasNextFallback = idx < totalAttempts - 1;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        candidateModel
      )}:generateContent`;

      let response: Response;
      try {
        response = await fetchWithTimeout(
          endpoint,
          {
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
          },
          this.timeoutMs
        );
      } catch (error) {
        const isTimeout = error instanceof LLMTimeoutError;
        const msg =
          error instanceof Error ? sanitizeUpstreamMessage(error.message) : 'Network error';

        console.warn('[llm/gemini] attempt failed', {
          provider: this.name,
          model: candidateModel,
          attempt: idx + 1,
          totalAttempts,
          httpStatus: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
        });

        lastError = new LLMError(
          isTimeout
            ? 'Yapay zeka servisi 45 saniye içinde yanıt vermedi (zaman aşımı). Lütfen tekrar deneyin.'
            : 'Yapay zeka servisine bağlanılamadı. Lütfen birkaç saniye sonra tekrar deneyin.',
          this.name,
          {
            statusCode: isTimeout ? 504 : 502,
            model: candidateModel,
            upstreamMessage: msg,
          }
        );

        if (hasNextFallback) {
          continue;
        }
        break;
      }

      console.info('[llm/gemini] attempt', {
        provider: this.name,
        model: candidateModel,
        attempt: idx + 1,
        totalAttempts,
        httpStatus: response.status,
      });

      if (!response.ok) {
        const upstreamMessage = await extractUpstreamErrorMessage(response);
        const mapped = mapUpstreamError(this.name, response.status, {
          model: candidateModel,
          upstreamMessage,
        });
        lastError = mapped;

        if (FALLBACK_STATUS_CODES.has(response.status)) {
          if (hasNextFallback) {
            continue;
          }
          break;
        }
        throw mapped;
      }

      const data = (await response.json()) as GeminiResponseBody;
      const text = extractGeminiResponseText(data);

      if (!text) {
        throw new LLMError('Gemini boş yanıt döndürdü. Lütfen tekrar deneyin.', this.name, {
          statusCode: 502,
          model: candidateModel,
          upstreamStatus: response.status,
          upstreamMessage: 'Empty non-thought text in response parts',
        });
      }

      console.info('[llm/gemini] model succeeded', {
        provider: this.name,
        model: candidateModel,
        httpStatus: response.status,
      });

      return {
        text,
        provider: this.name,
        model: candidateModel,
      };
    }

    if (totalAttempts > 1 && lastError) {
      throw new LLMError(
        'Tüm yedek Gemini modelleri denendi ancak yanıt alınamadı. Lütfen birkaç saniye sonra tekrar deneyin veya farklı bir sağlayıcı/API anahtarı kullanın.',
        this.name,
        {
          statusCode: lastError.statusCode,
          model: lastError.model,
          upstreamStatus: lastError.upstreamStatus,
          upstreamMessage: lastError.upstreamMessage,
        }
      );
    }

    throw (
      lastError ??
      new LLMError(
        'Yapay zeka servisine şu anda ulaşılamıyor. Lütfen birkaç saniye sonra tekrar deneyin.',
        this.name,
        { statusCode: 502, model: this.model }
      )
    );
  }
}
