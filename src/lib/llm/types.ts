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

export class LLMError extends Error {
  public readonly statusCode: number;
  public readonly provider: LLMProviderName;

  constructor(message: string, provider: LLMProviderName, statusCode = 502) {
    super(message);
    this.name = 'LLMError';
    this.provider = provider;
    this.statusCode = statusCode;
  }
}

export const DEFAULT_MODELS: Record<LLMProviderName, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
};

export function mapUpstreamError(provider: LLMProviderName, status: number): LLMError {
  if (status === 401 || status === 403) {
    return new LLMError(
      'API anahtarı geçersiz veya yetkisiz görünüyor. Lütfen anahtarınızı kontrol edip tekrar deneyin.',
      provider,
      401
    );
  }
  if (status === 429) {
    return new LLMError(
      'Seçili yapay zeka sağlayıcısında kota veya istek sınırına ulaşıldı. Biraz bekleyin veya kendi API anahtarınızı kullanın.',
      provider,
      429
    );
  }
  if (status === 400) {
    return new LLMError(
      'Yapay zeka sağlayıcısı isteği reddetti. Seçili model adını veya isteği kontrol edin.',
      provider,
      400
    );
  }
  return new LLMError(
    'Yapay zeka servisine şu anda ulaşılamıyor. Lütfen birkaç saniye sonra tekrar deneyin.',
    provider,
    502
  );
}
