/**
 * Extracts a JSON object from an LLM text response, tolerating optional
 * markdown code fences (```json ... ```) or surrounding prose.
 */
export function extractJsonFromLLMResponse(rawText: string): unknown {
  const trimmed = rawText.trim();

  // Direct parse attempt first
  try {
    return JSON.parse(trimmed);
  } catch {
    // Fall through to fence/brace extraction
  }

  // Try stripping markdown code fences
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch {
      // Continue to brace scan
    }
  }

  // Fallback: locate outermost JSON object braces
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate);
  }

  throw new SyntaxError('LLM yanıtı geçerli bir JSON nesnesi içermiyor.');
}
