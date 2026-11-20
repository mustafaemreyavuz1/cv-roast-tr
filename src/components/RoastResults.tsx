'use client';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Flag,
  Quote,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Wrench,
} from 'lucide-react';
import {
  PROVIDER_LABELS,
  SECTOR_LABELS,
  TONE_LABELS,
  type RoastApiResponse,
} from '@/lib/schemas/roast';
import { ShareableRoastCard } from './ShareableRoastCard';

interface RoastResultsProps {
  data: RoastApiResponse;
  onReset: () => void;
}

function getScoreBadgeClasses(score: number): string {
  if (score >= 80) {
    return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300';
  }
  if (score >= 60) {
    return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300';
  }
  if (score >= 40) {
    return 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-300';
  }
  return 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300';
}

export function RoastResults({ data, onReset }: RoastResultsProps) {
  const { result, meta } = data;

  return (
    <div className="space-y-8">
      {/* Top Action Bar & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-stone-200/80 px-2.5 py-1 font-medium text-stone-700 dark:bg-zinc-800 dark:text-zinc-300">
            Ton: {TONE_LABELS[meta.tone].label}
          </span>
          <span className="rounded-full bg-stone-200/80 px-2.5 py-1 font-medium text-stone-700 dark:bg-zinc-800 dark:text-zinc-300">
            Sektör: {SECTOR_LABELS[meta.sector]}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{meta.maskingStats.total} kişisel veri maskelendi</span>
          </span>
          <span className="rounded-full bg-stone-200/80 px-2.5 py-1 font-medium text-stone-600 dark:bg-zinc-800 dark:text-zinc-400">
            {PROVIDER_LABELS[meta.provider]} · {meta.model}
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:border-ember-500 hover:text-ember-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-ember-500 dark:hover:text-ember-400"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Yeni CV Analiz Et</span>
        </button>
      </div>

      {/* Hero Score & Verdict */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div
            className={`flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-2xl border-2 ${getScoreBadgeClasses(
              result.overallScore
            )}`}
          >
            <span className="text-4xl font-extrabold leading-none">{result.overallScore}</span>
            <span className="mt-1 text-xs font-semibold opacity-80">/ 100</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-ember-600 dark:text-ember-400">
              İşe Alımcı Hükmü
            </p>
            <h2 className="text-xl font-bold leading-snug text-stone-900 dark:text-zinc-50 sm:text-2xl">
              {result.verdict}
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              {meta.wordCount} kelime analiz edildi · {meta.verifiedQuotesCount} alıntı CV metninde
              birebir doğrulandı
              {meta.filteredHallucinatedQuotesCount > 0
                ? ` (${meta.filteredHallucinatedQuotesCount} doğrulanamayan alıntı otomatik ayıklandı)`
                : ''}
            </p>
          </div>
        </div>
      </section>

      {/* First 6 Seconds */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">
          İşe Alımcının İlk 6 Saniyesi
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-zinc-300">
          {result.firstSixSeconds.summary}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-zinc-200">
              <Eye className="h-4 w-4 text-ember-500" />
              <span>İlk Bakışta Ne Görür?</span>
            </div>
            <ul className="space-y-2 text-sm text-stone-700 dark:text-zinc-300">
              {result.firstSixSeconds.whatRecruiterSees.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ember-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-zinc-200">
              <EyeOff className="h-4 w-4 text-rose-500" />
              <span>Neyi Kaçırır / Eksik Görür?</span>
            </div>
            <ul className="space-y-2 text-sm text-stone-700 dark:text-zinc-300">
              {result.firstSixSeconds.whatRecruiterMisses.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Top 3 Priorities */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-ember-500" />
          <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">
            Hemen Yapılacak En Önemli 3 Düzeltme
          </h3>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {result.topThreePriorities.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ember-500 text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      item.impact === 'high'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {item.impact === 'high' ? 'Yüksek Etki' : 'Orta Etki'}
                  </span>
                </div>
                <h4 className="mt-3 text-sm font-bold text-stone-900 dark:text-zinc-100">
                  {item.title}
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-zinc-300">
                  {item.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Optional Job Match */}
      {result.jobMatch && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">
                Hedef İş İlanı Uyum Analizi
              </h3>
            </div>
            <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
              Uyum Skoru: %{result.jobMatch.matchScore}
            </span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-stone-700 dark:text-zinc-300">
            {result.jobMatch.summary}
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Eksik Anahtar Kelimeler
              </h4>
              {result.jobMatch.missingKeywords.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {result.jobMatch.missingKeywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-800 dark:border-indigo-800 dark:bg-zinc-900 dark:text-indigo-300"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-stone-500 dark:text-zinc-400">
                  Belirgin eksik anahtar kelime tespit edilmedi.
                </p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Uyumsuzluklar
              </h4>
              {result.jobMatch.mismatches.length > 0 ? (
                <ul className="mt-2 space-y-1.5 text-sm text-stone-700 dark:text-zinc-300">
                  {result.jobMatch.mismatches.map((mismatch, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                      <span>{mismatch}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-stone-500 dark:text-zinc-400">
                  Büyük bir uyumsuzluk tespit edilmedi.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Section Critiques */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-ember-500" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">
              Bölüm Bazlı Eleştiriler &amp; Somut Düzeltmeler
            </h3>
          </div>
          <span className="text-xs text-stone-500 dark:text-zinc-400">
            Tüm alıntılar CV’nizde doğrulanmıştır
          </span>
        </div>

        {result.sectionCritiques.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            CV metninde birebir doğrulanabilen bölüm alıntısı eşleşmedi. Daha detaylı bir CV metni
            ile tekrar deneyebilirsiniz.
          </div>
        ) : (
          <div className="space-y-4">
            {result.sectionCritiques.map((critique, idx) => (
              <article
                key={idx}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-md bg-ember-100 px-2.5 py-1 text-xs font-bold text-ember-800 dark:bg-ember-950/60 dark:text-ember-300">
                    {critique.section}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Doğrulanmış Alıntı</span>
                  </span>
                </div>

                {/* Quote */}
                <blockquote className="mt-3 flex items-start gap-2.5 rounded-xl border-l-4 border-ember-500 bg-stone-50 p-3.5 text-sm italic text-stone-700 dark:bg-zinc-950/70 dark:text-zinc-300">
                  <Quote className="mt-0.5 h-4 w-4 shrink-0 text-ember-500" />
                  <span>“{critique.quote}”</span>
                </blockquote>

                {/* Witty comment + Issue */}
                <div className="mt-4 space-y-2.5 text-sm">
                  <p className="font-semibold text-stone-900 dark:text-zinc-100">
                    {critique.wittyComment}
                  </p>
                  <p className="text-stone-600 dark:text-zinc-300">
                    <strong className="text-stone-800 dark:text-zinc-200">Sorun:</strong>{' '}
                    {critique.issue}
                  </p>
                  <p className="text-emerald-800 dark:text-emerald-300">
                    <strong>Somut Düzeltme:</strong> {critique.concreteFix}
                  </p>
                </div>

                {/* Before / After */}
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/20">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                      Önce
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-700 dark:text-zinc-300">
                      {critique.beforeAfter.before}
                    </p>
                  </div>

                  <div className="hidden items-center justify-center text-stone-400 md:flex">
                    <ArrowRight className="h-4 w-4" />
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Sonra
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-800 dark:text-zinc-200">
                      {critique.beforeAfter.after}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Cliche Detector & Turkey Specific Warnings */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cliches */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">
              Klişe Dedektörü
            </h3>
          </div>

          {result.clicheDetector.length === 0 ? (
            <p className="mt-3 text-sm text-stone-600 dark:text-zinc-400">
              Tebrikler! Belirgin bir CV klişesi tespit edilmedi.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {result.clicheDetector.map((cliche, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                      “{cliche.phrase}”
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      {cliche.count}x
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-stone-600 dark:text-zinc-300">
                    {cliche.suggestion}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Turkey Specific */}
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">
              Türkiye’ye Özgü Uyarılar
            </h3>
          </div>

          {result.turkeySpecificWarnings.length === 0 ? (
            <p className="mt-3 text-sm text-stone-600 dark:text-zinc-400">
              Türkiye’ye özgü gereksiz kişisel bilgi veya klasik format hatası tespit edilmedi.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {result.turkeySpecificWarnings.map((item, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 dark:border-zinc-800 dark:bg-zinc-950/60"
                >
                  <span className="inline-block rounded bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                    {item.category}
                  </span>
                  <p className="mt-1.5 text-sm font-medium text-stone-800 dark:text-zinc-200">
                    {item.warning}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-zinc-400">
                    <strong className="text-stone-700 dark:text-zinc-300">Öneri:</strong>{' '}
                    {item.recommendation}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Shareable Roast Card */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">
          Paylaşılabilir Roast Kartı
        </h3>
        <ShareableRoastCard card={result.shareableCard} tone={meta.tone} />
      </section>
    </div>
  );
}
