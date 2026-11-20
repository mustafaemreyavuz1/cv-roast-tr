'use client';

import { Flame } from 'lucide-react';
import { useEffect, useState } from 'react';

const LOADING_MESSAGES = [
  'CV’niz okunuyor, işe alımcı çayını tazeliyor...',
  'Kişisel veriler KVKK kalkanıyla maskeleniyor...',
  '“MS Office bilgisi” ve “takım çalışmasına yatkın” klişeleri taranıyor...',
  'İşe alımcının ilk 6 saniye göz taraması simüle ediliyor...',
  'Alıntılar halüsinasyon filtresinden geçiriliyor...',
  'Acımasızlık kalibre ediliyor, somut düzeltmeler hazırlanıyor...',
];

export function LoadingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-ember-200 bg-white p-10 text-center shadow-sm dark:border-ember-900/50 dark:bg-zinc-900"
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-ember-100 text-ember-600 dark:bg-ember-950/60 dark:text-ember-400">
        <Flame className="h-8 w-8 animate-pulse" />
        <span className="absolute -inset-1 rounded-2xl border-2 border-ember-500/30 animate-ping" />
      </div>
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-stone-900 dark:text-zinc-100">
          {LOADING_MESSAGES[messageIndex]}
        </p>
        <p className="text-xs text-stone-500 dark:text-zinc-400">
          Bu işlem genellikle 5–15 saniye sürer. Verileriniz hiçbir yere kaydedilmez.
        </p>
      </div>
    </div>
  );
}
