import { applyHallucinationGuard } from '@/lib/analysis/quote-verifier';
import { extractJsonFromLLMResponse, LLMError, type LLMProvider } from '@/lib/llm';
import { validateCvText } from '@/lib/pdf/extract';
import { maskPII } from '@/lib/privacy/pii-masker';
import { composeRoastPrompt } from '@/lib/prompts/composer';
import {
  RoastOutputSchema,
  type RoastApiResponse,
  type SectorMode,
  type ToneMode,
} from '@/lib/schemas/roast';

export interface RunRoastAnalysisInput {
  rawCvText: string;
  tone: ToneMode;
  sector: SectorMode;
  jobDescription?: string;
  provider: LLMProvider;
  promptsDir?: string;
}

/**
 * End-to-end CV Roast pipeline:
 * 1. Validate text length & word count
 * 2. Mask PII (KVKK) before sending anything to the LLM
 * 3. Compose modular prompts with prompt-injection delimiters
 * 4. Call LLM provider
 * 5. Parse & validate JSON via Zod
 * 6. Verify every critique quote exists in CV (hallucination guard)
 * 7. Double-scrub shareableCard.funniestLine against PII
 *
 * Never persists or logs CV text, LLM responses, or API keys.
 */
export async function runRoastAnalysis(input: RunRoastAnalysisInput): Promise<RoastApiResponse> {
  const { normalizedText, wordCount } = validateCvText(input.rawCvText);
  const { maskedText: maskedCv, stats: maskingStats } = maskPII(normalizedText);

  const maskedJobDescription = input.jobDescription?.trim()
    ? maskPII(input.jobDescription.trim()).maskedText
    : undefined;

  const { systemPrompt, userPrompt } = await composeRoastPrompt({
    cvText: maskedCv,
    tone: input.tone,
    sector: input.sector,
    jobDescription: maskedJobDescription,
    promptsDir: input.promptsDir,
  });

  const llmResponse = await input.provider.generateJSON({
    systemPrompt,
    userPrompt,
    temperature: input.tone === 'brutal' ? 0.8 : 0.65,
    maxTokens: 4096,
  });

  let parsedJson: unknown;
  try {
    parsedJson = extractJsonFromLLMResponse(llmResponse.text);
  } catch {
    throw new LLMError(
      'Yapay zeka yanıtı beklenen JSON formatında okunamadı. Lütfen tekrar deneyin.',
      input.provider.name,
      502
    );
  }

  const validation = RoastOutputSchema.safeParse(parsedJson);
  if (!validation.success) {
    throw new LLMError(
      'Yapay zeka yanıtı şema doğrulamasından geçemedi. Lütfen tekrar deneyin.',
      input.provider.name,
      502
    );
  }

  const { sanitizedOutput, verifiedCount, filteredCount } = applyHallucinationGuard(
    validation.data,
    maskedCv
  );

  // Defense-in-depth: ensure shareable card line contains zero PII and score matches overallScore
  const cleanFunniestLine = maskPII(sanitizedOutput.shareableCard.funniestLine).maskedText;

  const finalResult = {
    ...sanitizedOutput,
    jobMatch: maskedJobDescription ? (sanitizedOutput.jobMatch ?? null) : null,
    shareableCard: {
      score: sanitizedOutput.overallScore,
      funniestLine: cleanFunniestLine,
    },
  };

  return {
    result: finalResult,
    meta: {
      tone: input.tone,
      sector: input.sector,
      provider: llmResponse.provider,
      model: llmResponse.model,
      wordCount,
      maskingStats,
      verifiedQuotesCount: verifiedCount,
      filteredHallucinatedQuotesCount: filteredCount,
    },
  };
}
