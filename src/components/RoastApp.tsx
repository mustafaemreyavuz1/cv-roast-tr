'use client';

import {
  AlertCircle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  FileText,
  Flame,
  KeyRound,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { SAMPLE_CV_PRESETS } from '@/lib/examples/samples';
import {
  LLM_PROVIDERS,
  PROVIDER_LABELS,
  SECTOR_LABELS,
  SECTOR_MODES,
  TONE_LABELS,
  TONE_MODES,
  type LLMProviderName,
  type RoastApiResponse,
  type SectorMode,
  type ToneMode,
} from '@/lib/schemas/roast';
import { LoadingOverlay } from './LoadingOverlay';
import { PrivacyNotice } from './PrivacyNotice';
import { RoastResults } from './RoastResults';

type InputTab = 'pdf' | 'text';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function RoastApp() {
  const [activeTab, setActiveTab] = useState<InputTab>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cvText, setCvText] = useState('');
  const [tone, setTone] = useState<ToneMode>('honest');
  const [sector, setSector] = useState<SectorMode>('general');

  const [showJobSection, setShowJobSection] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  const [showByokSection, setShowByokSection] = useState(false);
  const [byokProvider, setByokProvider] = useState<LLMProviderName>('gemini');
  const [byokModel, setByokModel] = useState('');
  const [byokApiKey, setByokApiKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoastApiResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelection = (file: File | null) => {
    setError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Yalnızca PDF dosyaları kabul edilir. Dilerseniz düz metin sekmesini kullanabilirsiniz.');
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError('PDF dosyası 5 MB sınırını aşıyor. Daha küçük bir dosya yükleyin veya metni yapıştırın.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFileSelection(file);
  };

  const loadSample = (presetId: string) => {
    const preset = SAMPLE_CV_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setActiveTab('text');
    setSelectedFile(null);
    setCvText(preset.text);
    setSector(preset.sector);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'pdf' && !selectedFile) {
      setError('Lütfen bir PDF dosyası seçin veya “Düz Metin Yapıştır” sekmesine geçin.');
      return;
    }

    if (activeTab === 'text' && cvText.trim().length < 30) {
      setError('Lütfen analiz edilebilecek kadar CV metni yapıştırın (en az birkaç satır).');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('tone', tone);
      formData.append('sector', sector);

      if (activeTab === 'pdf' && selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('cvText', cvText);
      }

      if (jobDescription.trim()) {
        formData.append('jobDescription', jobDescription.trim());
      }

      if (byokApiKey.trim()) {
        formData.append('provider', byokProvider);
        formData.append('apiKey', byokApiKey.trim());
        if (byokModel.trim()) {
          formData.append('model', byokModel.trim());
        }
      }

      const response = await fetch('/api/roast', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | RoastApiResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        const message =
          data && 'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.';
        setError(message);
        return;
      }

      if (!data || !('result' in data)) {
        setError('Sunucudan beklenmeyen bir yanıt alındı.');
        return;
      }

      setResult(data);
    } catch {
      setError('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  if (loading) {
    return <LoadingOverlay />;
  }

  if (result) {
    return <RoastResults data={result} onReset={handleReset} />;
  }

  return (
    <div className="space-y-6">
      <PrivacyNotice />

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-7"
      >
        {/* Input Mode Tabs */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="CV Giriş Yöntemi"
              className="inline-flex rounded-xl bg-stone-100 p-1 dark:bg-zinc-950"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'pdf'}
                onClick={() => {
                  setActiveTab('pdf');
                  setError(null);
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  activeTab === 'pdf'
                    ? 'bg-white text-stone-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-stone-600 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>PDF Yükle</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'text'}
                onClick={() => {
                  setActiveTab('text');
                  setError(null);
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                  activeTab === 'text'
                    ? 'bg-white text-stone-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-stone-600 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Düz Metin Yapıştır</span>
              </button>
            </div>

            {/* Quick fictional sample presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 text-ember-500" />
                <span>Hızlı dene:</span>
              </span>
              {SAMPLE_CV_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => loadSample(preset.id)}
                  className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-700 transition hover:border-ember-400 hover:text-ember-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-ember-500 dark:hover:text-ember-400"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'pdf' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
                isDragging
                  ? 'border-ember-500 bg-ember-50/50 dark:bg-ember-950/20'
                  : 'border-stone-300 bg-stone-50/70 hover:border-ember-400 dark:border-zinc-700 dark:bg-zinc-950/40 dark:hover:border-ember-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => handleFileSelection(e.target.files?.[0] ?? null)}
                className="sr-only"
                id="cv-pdf-input"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="max-w-[240px] truncate sm:max-w-xs">{selectedFile.name}</span>
                    <span className="text-xs opacity-75">
                      ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      aria-label="Seçili dosyayı kaldır"
                      className="ml-1 rounded p-0.5 hover:bg-emerald-200/60 dark:hover:bg-emerald-900"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-zinc-400">
                    Dosya diske yazılmadan yalnızca bellekte okunacaktır.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ember-100 text-ember-600 dark:bg-ember-950/60 dark:text-ember-400">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="cv-pdf-input"
                      className="cursor-pointer font-semibold text-ember-600 hover:underline dark:text-ember-400"
                    >
                      PDF dosyası seçin
                    </label>
                    <span className="text-sm text-stone-600 dark:text-zinc-400">
                      {' '}
                      veya buraya sürükleyip bırakın
                    </span>
                    <p className="text-xs text-stone-500 dark:text-zinc-500">
                      Sadece PDF · Maksimum 5 MB · En fazla 6.000 kelime
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <label
                htmlFor="cv-text-area"
                className="block text-xs font-semibold text-stone-700 dark:text-zinc-300"
              >
                CV Metniniz
              </label>
              <textarea
                id="cv-text-area"
                rows={10}
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                placeholder="CV’nizin içeriğini buraya yapıştırın... (E-posta, telefon, TC kimlik no, IBAN ve açık adres otomatik maskelenir)"
                className="w-full rounded-xl border border-stone-300 bg-stone-50/50 p-3.5 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-500/20 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>
          )}
        </div>

        {/* Tone Selection */}
        <fieldset className="space-y-2.5">
          <legend className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400">
            Ton Modu
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {TONE_MODES.map((mode) => {
              const info = TONE_LABELS[mode];
              const isSelected = tone === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTone(mode)}
                  aria-pressed={isSelected}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    isSelected
                      ? 'border-ember-500 bg-ember-50/80 ring-2 ring-ember-500/20 dark:border-ember-500 dark:bg-ember-950/30'
                      : 'border-stone-200 bg-stone-50/60 hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                      {info.label}
                    </span>
                    {mode === 'brutal' && (
                      <Flame className="h-4 w-4 text-ember-500" />
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-zinc-400">
                    {info.description}
                  </p>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Sector Selection */}
        <fieldset className="space-y-2.5">
          <legend className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-zinc-400">
            Sektör Modu
          </legend>
          <div className="flex flex-wrap gap-2">
            {SECTOR_MODES.map((item) => {
              const isSelected = sector === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSector(item)}
                  aria-pressed={isSelected}
                  className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition ${
                    isSelected
                      ? 'border-ember-500 bg-ember-500 text-white shadow-sm'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-ember-400 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-300 dark:hover:border-ember-500'
                  }`}
                >
                  {SECTOR_LABELS[item]}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Optional Target Job Description */}
        <div className="rounded-xl border border-stone-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowJobSection((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-stone-700 hover:text-stone-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            <span className="inline-flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-500" />
              <span>Hedef İş İlanı Ekle (Opsiyonel — Uyum Analizi)</span>
            </span>
            {showJobSection ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showJobSection && (
            <div className="border-t border-stone-200 p-4 dark:border-zinc-800">
              <textarea
                rows={5}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Başvuracağınız iş ilanının metnini yapıştırın. Eksik anahtar kelimeler ve uyumsuzluklar ayrıca raporlanır."
                className="w-full rounded-lg border border-stone-300 bg-stone-50/50 p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950/60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>
          )}
        </div>

        {/* Optional BYOK Section */}
        <div className="rounded-xl border border-stone-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setShowByokSection((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-stone-700 hover:text-stone-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            <span className="inline-flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-500" />
              <span>Kendi API Anahtarınla Kullan — BYOK (Opsiyonel)</span>
            </span>
            {showByokSection ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showByokSection && (
            <div className="space-y-3 border-t border-stone-200 p-4 dark:border-zinc-800">
              <p className="text-xs leading-relaxed text-stone-600 dark:text-zinc-400">
                API anahtarınız yalnızca bu tek analiz isteği süresince sunucu belleğinde kullanılır;
                hiçbir yere kaydedilmez ve loglanmaz. Boş bırakırsanız sunucunun varsayılan yapılandırması
                kullanılır.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="byok-provider"
                    className="mb-1 block text-xs font-medium text-stone-700 dark:text-zinc-300"
                  >
                    Sağlayıcı
                  </label>
                  <select
                    id="byok-provider"
                    value={byokProvider}
                    onChange={(e) => setByokProvider(e.target.value as LLMProviderName)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-ember-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    {LLM_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_LABELS[p]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="byok-model"
                    className="mb-1 block text-xs font-medium text-stone-700 dark:text-zinc-300"
                  >
                    Model (Opsiyonel)
                  </label>
                  <input
                    id="byok-model"
                    type="text"
                    value={byokModel}
                    onChange={(e) => setByokModel(e.target.value)}
                    placeholder="Varsayılan model"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-ember-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="byok-key"
                    className="mb-1 block text-xs font-medium text-stone-700 dark:text-zinc-300"
                  >
                    API Anahtarı
                  </label>
                  <input
                    id="byok-key"
                    type="password"
                    autoComplete="off"
                    value={byokApiKey}
                    onChange={(e) => setByokApiKey(e.target.value)}
                    placeholder="API anahtarınız"
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-ember-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Box */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ember-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-ember-700 focus:outline-none focus:ring-2 focus:ring-ember-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          <Flame className="h-4 w-4" />
          <span>CV’mi Roastla</span>
        </button>
      </form>
    </div>
  );
}
