import { LLMProviderSchema, type LLMProviderName } from '@/lib/schemas/roast';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OpenAIProvider } from './openai';
import { DEFAULT_MODELS, LLMError, type LLMProvider } from './types';

export interface ResolveProviderOptions {
  /** Optional provider selected by user (BYOK flow) */
  provider?: LLMProviderName;
  /** Optional model override explicitly chosen by user */
  model?: string;
  /** Optional user-supplied API key used only for the lifetime of this request */
  apiKey?: string;
}

function getEnvApiKey(provider: LLMProviderName): string | undefined {
  switch (provider) {
    case 'gemini':
      return process.env.GEMINI_API_KEY?.trim() || undefined;
    case 'openai':
      return process.env.OPENAI_API_KEY?.trim() || undefined;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY?.trim() || undefined;
  }
}

export function getDefaultProviderName(): LLMProviderName {
  const raw = process.env.LLM_PROVIDER?.trim().toLowerCase();
  const parsed = LLMProviderSchema.safeParse(raw);
  return parsed.success ? parsed.data : 'gemini';
}

export function createLLMProvider(options: ResolveProviderOptions = {}): LLMProvider {
  const providerName = options.provider ?? getDefaultProviderName();
  const userKey = options.apiKey?.trim() || undefined;
  const resolvedKey = userKey ?? getEnvApiKey(providerName);

  if (!resolvedKey) {
    throw new LLMError(
      `Seçili sağlayıcı (${providerName}) için API anahtarı bulunamadı. Sunucu ayarlarını yapılandırın veya arayüzden kendi API anahtarınızı (BYOK) girin.`,
      providerName,
      400
    );
  }

  const explicitUserModel = options.model?.trim() || undefined;

  // Only inherit env LLM_MODEL if the resolved provider matches the env default provider
  const envDefaultProvider = getDefaultProviderName();
  const envModel =
    providerName === envDefaultProvider ? process.env.LLM_MODEL?.trim() || undefined : undefined;
  const resolvedModel = explicitUserModel || envModel || DEFAULT_MODELS[providerName];

  switch (providerName) {
    case 'gemini':
      // If user explicitly picked a model, disable fallback chain and only try that model.
      return new GeminiProvider(resolvedKey, resolvedModel, {
        enableFallback: !explicitUserModel,
      });
    case 'openai':
      return new OpenAIProvider(resolvedKey, resolvedModel);
    case 'anthropic':
      return new AnthropicProvider(resolvedKey, resolvedModel);
  }
}
