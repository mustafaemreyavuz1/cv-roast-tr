import type { LLMProviderName } from '@/lib/schemas/roast';

export interface LLMGenerateRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMGenerateResponse {
  text: string;
  provider: LLMProviderName;
  model: string;
}

export interface LLMProvider {
  readonly name: LLMProviderName;
  readonly model: string;
  generateJSON(request: LLMGenerateRequest): Promise<LLMGenerateResponse>;
}

export interface LLMErrorOptions {
  statusCode?: number;
  model?: string;
  upstreamStatus?: number;
  upstreamMessage?: string;
}

export class LLMError extends Error {
  public readonly statusCode: number;
  public readonly provider: LLMProviderName;
  public readonly model?: string;
  public readonly upstreamStatus?: number;
  public readonly upstreamMessage?: string;

  constructor(
    message: string,
    provider: LLMProviderName,
    statusCodeOrOptions: number | LLMErrorOptions = 502
  ) {
    super(message);
    this.name = 'LLMError';
    this.provider = provider;

    if (typeof statusCodeOrOptions === 'number') {
      this.statusCode = statusCodeOrOptions;
    } else {
      this.statusCode = statusCodeOrOptions.statusCode ?? 502;
      this.model = statusCodeOrOptions.model;
      this.upstreamStatus = statusCodeOrOptions.upstreamStatus;
      this.upstreamMessage = statusCodeOrOptions.upstreamMessage;
    }
  }
}

export const DEFAULT_MODELS: Record<LLMProviderName, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
};

const MAX_LOG_MESSAGE_LENGTH = 500;

/**
 * Redacts accidental API key / bearer token patterns from upstream error strings
 * before logging to server stderr.
 */
export function sanitizeUpstreamMessage(raw: string): string {
  const redacted = raw
    .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, '[REDACTED_KEY]')
    .replace(/\bsk-(?:ant-)?[0-9A-Za-z_-]{16,}\b/g, '[REDACTED_KEY]')
    .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED_KEY]')
    .replace(/\s+/g, ' ')
    .trim();

  if (redacted.length <= MAX_LOG_MESSAGE_LENGTH) {
    return redacted;
  }
  return `${redacted.slice(0, MAX_LOG_MESSAGE_LENGTH)}...`;
}

/**
 * Extracts a concise provider error message from an HTTP error response
 * (supports Gemini, OpenAI, and Anthropic JSON shapes as well as plain text).
 */
export async function extractUpstreamErrorMessage(response: Response): Promise<string> {
  const rawText = await response.text().catch(() => '');
  if (!rawText.trim()) {
    return response.statusText || 'Unknown upstream error';
  }

  try {
    const parsed = JSON.parse(rawText) as {
      error?: { message?: unknown; status?: unknown; type?: unknown };
      message?: unknown;
    };
    const msg =
      typeof parsed.error?.message === 'string'
        ? parsed.error.message
        : typeof parsed.message === 'string'
          ? parsed.message
          : rawText;
    return sanitizeUpstreamMessage(msg);
  } catch {
    return sanitizeUpstreamMessage(rawText);
  }
}

export function mapUpstreamError(
  provider: LLMProviderName,
  status: number,
  options?: { model?: string; upstreamMessage?: string }
): LLMError {
  const baseDetails = {
    model: options?.model,
    upstreamStatus: status,
    upstreamMessage: options?.upstreamMessage,
  };

  if (status === 400) {
    return new LLMError(
      'Yapay zeka sağlayıcısı isteği geçersiz buldu (400). Model adını veya istek ayarlarını kontrol edin.',
      provider,
      { ...baseDetails, statusCode: 400 }
    );
  }
  if (status === 401) {
    return new LLMError(
      'API anahtarı geçersiz görünüyor (401). Lütfen anahtarınızı kontrol edip tekrar deneyin.',
      provider,
      { ...baseDetails, statusCode: 401 }
    );
  }
  if (status === 403) {
    return new LLMError(
      'API anahtarınızın bu modele veya servise erişim yetkisi yok (403). Hesap izinlerinizi kontrol edin.',
      provider,
      { ...baseDetails, statusCode: 403 }
    );
  }
  if (status === 404) {
    return new LLMError(
      'Seçili yapay zeka modeli bulunamadı (404). Model adını kontrol edin veya varsayılan modeli kullanın.',
      provider,
      { ...baseDetails, statusCode: 404 }
    );
  }
  if (status === 429) {
    return new LLMError(
      'Seçili yapay zeka sağlayıcısında kota veya istek sınırına ulaşıldı (429). Biraz bekleyin veya kendi API anahtarınızı kullanın.',
      provider,
      { ...baseDetails, statusCode: 429 }
    );
  }
  return new LLMError(
    'Yapay zeka servisine şu anda ulaşılamıyor. Lütfen birkaç saniye sonra tekrar deneyin.',
    provider,
    { ...baseDetails, statusCode: 502 }
  );
}
