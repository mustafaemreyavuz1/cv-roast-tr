'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle('dark', nextDark);
    try {
      localStorage.setItem('cv-roast-theme', nextDark ? 'dark' : 'light');
    } catch {
      // Ignore storage access errors in private mode
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-sm transition hover:border-ember-400 hover:text-ember-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-ember-500 dark:hover:text-ember-400"
    >
      {mounted && isDark ? (
        <>
          <Sun className="h-4 w-4 text-amber-400" />
          <span className="hidden sm:inline">Açık Tema</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-stone-600 dark:text-zinc-300" />
          <span className="hidden sm:inline">Koyu Tema</span>
        </>
      )}
    </button>
  );
}
