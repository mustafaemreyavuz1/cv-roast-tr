import { Flame } from 'lucide-react';
import { RoastApp } from '@/components/RoastApp';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-stone-50/85 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ember-600 text-white shadow-sm">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-stone-900 dark:text-zinc-100">
                CV Roast TR
              </span>
              <span className="ml-2 hidden rounded-md bg-ember-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ember-700 dark:bg-ember-950/70 dark:text-ember-400 sm:inline">
                Açık Kaynak
              </span>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 space-y-3 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-zinc-50 sm:text-4xl">
            Pohpohlamayan Türkçe CV Eleştirmeni
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-zinc-400 sm:text-base">
            Acımasız ama adil bir işe alım yöneticisi gözüyle CV’nizi inceler; Türkiye’ye özgü
            klişeleri yakalar ve <strong>her eleştirinin yanına somut bir düzeltme</strong> koyar.
          </p>
        </div>

        <RoastApp />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 py-6 text-center text-xs text-stone-500 dark:border-zinc-800/80 dark:text-zinc-500">
        <div className="mx-auto max-w-4xl px-4">
          CV Roast TR · Sıfır izleme, sıfır veritabanı · MIT Lisansı ile açık kaynak
        </div>
      </footer>
    </div>
  );
}
