import { NextResponse } from 'next/server';
import { runRoastAnalysis } from '@/lib/analysis/roast-service';
import { createLLMProvider, LLMError } from '@/lib/llm';
import { CvInputError, extractPdfTextInMemory } from '@/lib/pdf/extract';
import {
  LLMProviderSchema,
  SectorModeSchema,
  ToneModeSchema,
  type LLMProviderName,
} from '@/lib/schemas/roast';
import { defaultRateLimiter, getClientIp } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const MAX_JOB_DESC_CHARS = 12_000;

export async function POST(request: Request): Promise<NextResponse> {
  // 1. In-memory per-IP rate limiting
  const clientIp = getClientIp(request.headers);
  const rateLimit = defaultRateLimiter.check(clientIp);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Çok fazla istek gönderdiniz. Lütfen ${rateLimit.retryAfterSeconds} saniye sonra tekrar deneyin.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  try {
    const contentType = request.headers.get('content-type') ?? '';
    let rawCvText = '';
    let toneRaw = 'honest';
    let sectorRaw = 'general';
    let jobDescription = '';
    let userProviderRaw = '';
    let userModel = '';
    let userApiKey = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const textField = formData.get('cvText');

      toneRaw = String(formData.get('tone') ?? 'honest');
      sectorRaw = String(formData.get('sector') ?? 'general');
      jobDescription = String(formData.get('jobDescription') ?? '');
      userProviderRaw = String(formData.get('provider') ?? '');
      userModel = String(formData.get('model') ?? '');
      userApiKey = String(formData.get('apiKey') ?? '');

      if (file instanceof File && file.size > 0) {
        // Strictly in-memory extraction, never written to disk
        const buffer = await file.arrayBuffer();
        rawCvText = await extractPdfTextInMemory(buffer, file.type);
      } else if (typeof textField === 'string' && textField.trim().length > 0) {
        rawCvText = textField;
      } else {
        throw new CvInputError('Lütfen bir PDF dosyası yükleyin veya CV metninizi yapıştırın.', 400);
      }
    } else {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body || typeof body !== 'object') {
        throw new CvInputError('Geçersiz istek gövdesi.', 400);
      }

      rawCvText = typeof body.cvText === 'string' ? body.cvText : '';
      toneRaw = typeof body.tone === 'string' ? body.tone : 'honest';
      sectorRaw = typeof body.sector === 'string' ? body.sector : 'general';
      jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription : '';
      userProviderRaw = typeof body.provider === 'string' ? body.provider : '';
      userModel = typeof body.model === 'string' ? body.model : '';
      userApiKey = typeof body.apiKey === 'string' ? body.apiKey : '';
    }

    const toneParsed = ToneModeSchema.safeParse(toneRaw);
    if (!toneParsed.success) {
      throw new CvInputError('Geçersiz ton modu seçimi.', 400);
    }

    const sectorParsed = SectorModeSchema.safeParse(sectorRaw);
    if (!sectorParsed.success) {
      throw new CvInputError('Geçersiz sektör modu seçimi.', 400);
    }

    let providerOverride: LLMProviderName | undefined;
    if (userProviderRaw.trim()) {
      const parsedProvider = LLMProviderSchema.safeParse(userProviderRaw.trim());
      if (!parsedProvider.success) {
        throw new CvInputError('Geçersiz yapay zeka sağlayıcısı seçimi.', 400);
      }
      providerOverride = parsedProvider.data;
    }

    if (jobDescription.length > MAX_JOB_DESC_CHARS) {
      throw new CvInputError(
        'Hedef iş ilanı metni çok uzun (maksimum 12.000 karakter). Lütfen kısaltıp tekrar deneyin.',
        413
      );
    }

    // BYOK: userApiKey is scoped strictly to this single request and never stored or logged
    const llmProvider = createLLMProvider({
      provider: providerOverride,
      model: userModel.trim() || undefined,
      apiKey: userApiKey.trim() || undefined,
    });

    const responsePayload = await runRoastAnalysis({
      rawCvText,
      tone: toneParsed.data,
      sector: sectorParsed.data,
      jobDescription: jobDescription.trim() || undefined,
      provider: llmProvider,
    });

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    if (error instanceof CvInputError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if (error instanceof LLMError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    // Never log request payload, CV content, or API keys
    return NextResponse.json(
      { error: 'Analiz sırasında beklenmeyen bir sunucu hatası oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
}
