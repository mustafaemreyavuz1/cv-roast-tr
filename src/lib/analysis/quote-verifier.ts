import type { RoastOutput, SectionCritique } from '@/lib/schemas/roast';

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  i: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
};

/**
 * Normalizes text for tolerant Turkish matching:
 * - Turkish locale lowercase (handles İ -> i, I -> ı)
 * - Folds Turkish diacritics to ASCII equivalents (ç->c, ğ->g, ı->i, ö->o, ş->s, ü->u)
 * - Strips punctuation and symbols
 * - Collapses all whitespace to a single space
 */
export function normalizeForQuoteMatch(text: string): string {
  const lowered = text.toLocaleLowerCase('tr-TR').normalize('NFKD');

  let folded = '';
  for (const ch of lowered) {
    // Skip combining diacritical marks (e.g., combining dot above from İ)
    if (ch >= '\u0300' && ch <= '\u036f') {
      continue;
    }
    folded += TURKISH_CHAR_MAP[ch] ?? ch;
  }

  return folded
    .replace(/['’`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks whether a quote returned by the LLM actually appears in the CV text.
 */
export function isQuoteInCV(quote: string, cvText: string): boolean {
  const cleanedQuote = quote.replace(/^[""«'….\s]+|[""»'….\s]+$/g, '');
  const normalizedQuote = normalizeForQuoteMatch(cleanedQuote);

  // Guard against empty or trivially short quotes (e.g. "ve", "a")
  if (normalizedQuote.length < 3) {
    return false;
  }

  const normalizedCV = normalizeForQuoteMatch(cvText);
  if (!normalizedCV) {
    return false;
  }

  return normalizedCV.includes(normalizedQuote);
}

export interface VerifyQuotesResult {
  verifiedCritiques: SectionCritique[];
  rejectedCritiques: SectionCritique[];
  verifiedCount: number;
  filteredCount: number;
}

/**
 * Filters section critiques to keep only those whose quotes are verified in the CV text.
 */
export function verifyCritiqueQuotes(
  critiques: SectionCritique[],
  cvText: string
): VerifyQuotesResult {
  const verifiedCritiques: SectionCritique[] = [];
  const rejectedCritiques: SectionCritique[] = [];

  for (const critique of critiques) {
    if (isQuoteInCV(critique.quote, cvText)) {
      verifiedCritiques.push(critique);
    } else {
      rejectedCritiques.push(critique);
    }
  }

  return {
    verifiedCritiques,
    rejectedCritiques,
    verifiedCount: verifiedCritiques.length,
    filteredCount: rejectedCritiques.length,
  };
}

/**
 * Applies quote verification to a full RoastOutput object.
 */
export function applyHallucinationGuard(
  output: RoastOutput,
  cvText: string
): {
  sanitizedOutput: RoastOutput;
  verifiedCount: number;
  filteredCount: number;
} {
  const { verifiedCritiques, verifiedCount, filteredCount } = verifyCritiqueQuotes(
    output.sectionCritiques,
    cvText
  );

  return {
    sanitizedOutput: {
      ...output,
      sectionCritiques: verifiedCritiques,
    },
    verifiedCount,
    filteredCount,
  };
}
