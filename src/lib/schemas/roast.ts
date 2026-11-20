import { z } from 'zod';

export const TONE_MODES = ['gentle', 'honest', 'brutal'] as const;
export type ToneMode = (typeof TONE_MODES)[number];

export const SECTOR_MODES = [
  'general',
  'software',
  'marketing',
  'finance',
  'engineering',
  'design',
] as const;
export type SectorMode = (typeof SECTOR_MODES)[number];

export const LLM_PROVIDERS = ['gemini', 'openai', 'anthropic'] as const;
export type LLMProviderName = (typeof LLM_PROVIDERS)[number];

export const ToneModeSchema = z.enum(TONE_MODES);
export const SectorModeSchema = z.enum(SECTOR_MODES);
export const LLMProviderSchema = z.enum(LLM_PROVIDERS);

export const FirstSixSecondsSchema = z.object({
  whatRecruiterSees: z.array(z.string().min(1)).min(1).max(6),
  whatRecruiterMisses: z.array(z.string().min(1)).min(1).max(6),
  summary: z.string().min(1),
});

export const BeforeAfterSchema = z.object({
  before: z.string().min(1),
  after: z.string().min(1),
});

export const SectionCritiqueSchema = z.object({
  section: z.string().min(1),
  quote: z.string().min(1),
  issue: z.string().min(1),
  wittyComment: z.string().min(1),
  concreteFix: z.string().min(1),
  beforeAfter: BeforeAfterSchema,
});

export const ClicheItemSchema = z.object({
  phrase: z.string().min(1),
  count: z.number().int().min(1),
  suggestion: z.string().min(1),
});

export const TurkeyWarningSchema = z.object({
  category: z.string().min(1),
  warning: z.string().min(1),
  recommendation: z.string().min(1),
});

export const PriorityFixSchema = z.object({
  title: z.string().min(1),
  impact: z.enum(['high', 'medium']),
  action: z.string().min(1),
});

export const JobMatchSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  missingKeywords: z.array(z.string().min(1)),
  mismatches: z.array(z.string().min(1)),
  summary: z.string().min(1),
});

export const ShareableCardSchema = z.object({
  score: z.number().int().min(0).max(100),
  funniestLine: z.string().min(1).max(240),
});

export const RoastOutputSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  verdict: z.string().min(1),
  firstSixSeconds: FirstSixSecondsSchema,
  sectionCritiques: z.array(SectionCritiqueSchema),
  clicheDetector: z.array(ClicheItemSchema),
  turkeySpecificWarnings: z.array(TurkeyWarningSchema),
  topThreePriorities: z.array(PriorityFixSchema).min(1).max(5),
  jobMatch: JobMatchSchema.nullable().optional(),
  shareableCard: ShareableCardSchema,
});

export type RoastOutput = z.infer<typeof RoastOutputSchema>;
export type SectionCritique = z.infer<typeof SectionCritiqueSchema>;
export type ClicheItem = z.infer<typeof ClicheItemSchema>;
export type TurkeyWarning = z.infer<typeof TurkeyWarningSchema>;
export type PriorityFix = z.infer<typeof PriorityFixSchema>;
export type JobMatch = z.infer<typeof JobMatchSchema>;
export type ShareableCard = z.infer<typeof ShareableCardSchema>;

export const MaskingStatsSchema = z.object({
  emails: z.number().int().min(0),
  phones: z.number().int().min(0),
  tcKimlik: z.number().int().min(0),
  ibans: z.number().int().min(0),
  urls: z.number().int().min(0),
  addresses: z.number().int().min(0),
  total: z.number().int().min(0),
});

export type MaskingStats = z.infer<typeof MaskingStatsSchema>;

export const RoastMetaSchema = z.object({
  tone: ToneModeSchema,
  sector: SectorModeSchema,
  provider: LLMProviderSchema,
  model: z.string().min(1),
  wordCount: z.number().int().min(0),
  maskingStats: MaskingStatsSchema,
  verifiedQuotesCount: z.number().int().min(0),
  filteredHallucinatedQuotesCount: z.number().int().min(0),
});

export type RoastMeta = z.infer<typeof RoastMetaSchema>;

export const RoastApiResponseSchema = z.object({
  result: RoastOutputSchema,
  meta: RoastMetaSchema,
});

export type RoastApiResponse = z.infer<typeof RoastApiResponseSchema>;

export const TONE_LABELS: Record<ToneMode, { label: string; description: string }> = {
  gentle: {
    label: 'Nazik',
    description: 'Yapıcı mentor tonu. Kırmadan ama pohpohlamadan doğruları söyler.',
  },
  honest: {
    label: 'Dürüst',
    description: 'Filtresiz işe alım yöneticisi. Net, dobracı ve kuru mizahlı.',
  },
  brutal: {
    label: 'Acımasız',
    description: 'Tam roast modu. Klişelere merhamet yok, her eleştiride somut çözüm var.',
  },
};

export const SECTOR_LABELS: Record<SectorMode, string> = {
  general: 'Genel',
  software: 'Yazılım',
  marketing: 'Pazarlama',
  finance: 'Finans',
  engineering: 'Mühendislik',
  design: 'Tasarım',
};

export const PROVIDER_LABELS: Record<LLMProviderName, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  anthropic: 'Anthropic Claude',
};
