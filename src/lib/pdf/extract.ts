import { extractText } from 'unpdf';

export const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_WORD_COUNT = 6000;
export const MIN_CHAR_COUNT = 30;

export class CvInputError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'CvInputError';
    this.statusCode = statusCode;
  }
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function validateCvText(text: string): { normalizedText: string; wordCount: number } {
  const normalizedText = text.replace(/\r\n/g, '\n').trim();

  if (normalizedText.length < MIN_CHAR_COUNT) {
    throw new CvInputError(
      'CV metni çok kısa görünüyor. Anlamlı bir analiz için en az birkaç satır CV içeriği girin.',
      400
    );
  }

  const wordCount = countWords(normalizedText);
  if (wordCount > MAX_WORD_COUNT) {
    throw new CvInputError(
      `CV metni çok uzun (${wordCount} kelime). Maksimum sınır ${MAX_WORD_COUNT} kelimedir; lütfen metni kısaltıp tekrar deneyin.`,
      413
    );
  }

  return { normalizedText, wordCount };
}

/**
 * Checks the PDF magic bytes (%PDF-) to verify the uploaded file is genuinely a PDF.
 */
export function hasPdfMagicBytes(buffer: Uint8Array): boolean {
  if (buffer.byteLength < 5) return false;
  return (
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46 && // F
    buffer[4] === 0x2d // -
  );
}

/**
 * Extracts text from a PDF buffer purely in memory (never writes to disk).
 */
export async function extractPdfTextInMemory(
  fileBuffer: ArrayBuffer,
  mimeType?: string
): Promise<string> {
  if (fileBuffer.byteLength === 0) {
    throw new CvInputError('Yüklenen PDF dosyası boş.', 400);
  }

  if (fileBuffer.byteLength > MAX_PDF_BYTES) {
    throw new CvInputError(
      'PDF dosyası 5 MB sınırını aşıyor. Lütfen daha küçük bir dosya yükleyin veya metni doğrudan yapıştırın.',
      413
    );
  }

  if (mimeType && mimeType !== 'application/pdf' && mimeType !== 'application/octet-stream') {
    throw new CvInputError('Yalnızca PDF dosyaları desteklenir.', 415);
  }

  const bytes = new Uint8Array(fileBuffer);
  if (!hasPdfMagicBytes(bytes)) {
    throw new CvInputError(
      'Geçersiz PDF dosyası. Lütfen gerçekten bir PDF dosyası yüklediğinizden emin olun.',
      415
    );
  }

  try {
    const result = await extractText(bytes, { mergePages: true });
    const extracted = Array.isArray(result.text) ? result.text.join('\n') : String(result.text);
    const cleaned = extracted.trim();

    if (!cleaned) {
      throw new CvInputError(
        'PDF dosyasından metin okunamadı. Dosya yalnızca taranmış görselden (resim) oluşuyor olabilir; lütfen CV metninizi düz metin sekmesinden yapıştırın.',
        422
      );
    }

    return cleaned;
  } catch (error) {
    if (error instanceof CvInputError) {
      throw error;
    }
    throw new CvInputError(
      'PDF dosyası okunurken bir hata oluştu. Şifreli veya bozuk bir PDF olabilir; metni kopyalayıp düz metin sekmesinden yapıştırmayı deneyin.',
      422
    );
  }
}
