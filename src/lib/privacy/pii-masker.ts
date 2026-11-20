import type { MaskingStats } from '@/lib/schemas/roast';

export interface MaskPIIResult {
  maskedText: string;
  stats: MaskingStats;
}

const PLACEHOLDERS = {
  email: '[E-POSTA]',
  phone: '[TELEFON]',
  tcKimlik: '[TC-KIMLIK]',
  iban: '[IBAN]',
  url: '[BAGLANTI]',
  address: '[ADRES]',
} as const;

// Turkish IBAN: TR followed by 24 digits with optional spaces or hyphens
const IBAN_REGEX = /\bTR\s?\d{2}(?:[\s-]?\d{4}){5}[\s-]?\d{2}\b/gi;

// Email addresses
const EMAIL_REGEX = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

// URLs and common profile links (strip trailing sentence punctuation carefully)
const URL_REGEX =
  /\b(?:https?:\/\/[^\s<>()[\]"']+|www\.[^\s<>()[\]"']+|(?:linkedin\.com|github\.com|gitlab\.com|behance\.net|dribbble\.com|medium\.com|x\.com|twitter\.com|instagram\.com|kaggle\.com)\/[^\s<>()[\]"']+)/gi;

// Turkish phone numbers:
// +90 5xx xxx xx xx, 0090 5xx..., 0 (5xx) xxx-xx-xx, 05xxxxxxxxx, 0212 xxx xx xx, 5xx xxx xx xx
const PHONE_REGEX =
  /(?<!\d)(?:(?:\+90|0090)[\s.-]*\(?(?:5\d{2}|[2-4]\d{2})\)?[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}|(?:\+90|0090)[\s.-]*\(?(?:5\d{2}|[2-4]\d{2})\)?[\s.-]*\d{3}[\s.-]*\d{4}|0[\s.-]*\(?(?:5\d{2}|[2-4]\d{2})\)?[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}|0[\s.-]*\(?(?:5\d{2}|[2-4]\d{2})\)?[\s.-]*\d{3}[\s.-]*\d{4}|5\d{2}[\s.-]+\d{3}[\s.-]+\d{2}[\s.-]+\d{2})(?!\d)/g;

// 11-digit Turkish Republic Identity Number (starts with 1-9)
const TC_KIMLIK_REGEX = /(?<!\d)[1-9]\d{10}(?!\d)/g;

// Explicit "Adres:" labeled line or segment
const LABELED_ADDRESS_REGEX =
  /\b(?:Açık\s+Adres|Ev\s+Adresi|İkametgah\s+Adresi|İkamet\s+Adresi|Adres)\s*:\s*[^\n\r]+/gi;

// Turkish street/neighborhood open address pattern within a line
const TURKISH_ADDRESS_LINE_REGEX =
  /(?:[A-ZÇĞİÖŞÜa-zçğıöşü0-9.'-]+\s+){1,5}(?:Mahallesi|Mah\.|Mh\.|Caddesi|Cad\.|Cd\.|Sokağı|Sokak|Sok\.|Sk\.|Bulvarı|Bulv\.|Blv\.)[^\n\r]*/gi;

// No:/Kat:/Daire: street detail pattern when not already caught
const STREET_NUMBER_ADDRESS_REGEX =
  /(?:[A-ZÇĞİÖŞÜa-zçğıöşü0-9.'-]+\s+){0,4}(?:Apt\.|Apartmanı|Sitesi|Blok)\s*,?\s*(?:No|Kat|Daire|D)\s*[:.]?\s*\d+[^\n\r]*/gi;

function trimTrailingPunctuation(match: string): { core: string; trailing: string } {
  let core = match;
  let trailing = '';
  while (core.length > 0 && /[.,;:!?)]$/.test(core)) {
    trailing = core.slice(-1) + trailing;
    core = core.slice(0, -1);
  }
  return { core, trailing };
}

/**
 * Masks Turkish PII from raw text before sending it to an LLM.
 * Order matters: IBAN -> Email -> URL -> Phone -> TC Kimlik -> Open Addresses.
 */
export function maskPII(input: string): MaskPIIResult {
  const stats: MaskingStats = {
    emails: 0,
    phones: 0,
    tcKimlik: 0,
    ibans: 0,
    urls: 0,
    addresses: 0,
    total: 0,
  };

  if (!input) {
    return { maskedText: '', stats };
  }

  let text = input;

  // 1. IBAN
  text = text.replace(IBAN_REGEX, () => {
    stats.ibans += 1;
    return PLACEHOLDERS.iban;
  });

  // 2. Email
  text = text.replace(EMAIL_REGEX, () => {
    stats.emails += 1;
    return PLACEHOLDERS.email;
  });

  // 3. URLs & profile links
  text = text.replace(URL_REGEX, (match) => {
    const { core, trailing } = trimTrailingPunctuation(match);
    if (!core) return match;
    stats.urls += 1;
    return `${PLACEHOLDERS.url}${trailing}`;
  });

  // 4. Turkish phone numbers
  text = text.replace(PHONE_REGEX, () => {
    stats.phones += 1;
    return PLACEHOLDERS.phone;
  });

  // 5. TC Kimlik No (11 digits)
  text = text.replace(TC_KIMLIK_REGEX, () => {
    stats.tcKimlik += 1;
    return PLACEHOLDERS.tcKimlik;
  });

  // 6. Open address patterns (labeled first, then neighborhood/street patterns)
  text = text.replace(LABELED_ADDRESS_REGEX, (match) => {
    const colonIdx = match.indexOf(':');
    const prefix = colonIdx !== -1 ? match.slice(0, colonIdx + 1) : 'Adres:';
    stats.addresses += 1;
    return `${prefix} ${PLACEHOLDERS.address}`;
  });

  text = text.replace(TURKISH_ADDRESS_LINE_REGEX, (match) => {
    if (match.includes(PLACEHOLDERS.address)) {
      return match;
    }
    stats.addresses += 1;
    return PLACEHOLDERS.address;
  });

  text = text.replace(STREET_NUMBER_ADDRESS_REGEX, (match) => {
    if (match.includes(PLACEHOLDERS.address)) {
      return match;
    }
    stats.addresses += 1;
    return PLACEHOLDERS.address;
  });

  stats.total =
    stats.emails + stats.phones + stats.tcKimlik + stats.ibans + stats.urls + stats.addresses;

  return { maskedText: text, stats };
}
