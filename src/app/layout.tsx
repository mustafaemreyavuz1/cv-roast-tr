import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CV Roast TR — Acımasız Ama Adil Türkçe CV Eleştirmeni',
  description:
    'Türkçe CV’nizi pohpohlamadan analiz eden, Türkiye’ye özgü klişeleri yakalayan ve her eleştirinin yanına somut düzeltme sunan gizlilik odaklı açık kaynak araç.',
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('cv-roast-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
