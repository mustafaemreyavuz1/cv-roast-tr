'use client';

import { Download, Flame, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { TONE_LABELS, type ShareableCard, type ToneMode } from '@/lib/schemas/roast';

interface ShareableRoastCardProps {
  card: ShareableCard;
  tone: ToneMode;
}

function getScoreAccent(score: number): { hex: string; label: string } {
  if (score >= 80) return { hex: '#10b981', label: 'Mülakata Hazır' };
  if (score >= 60) return { hex: '#f59e0b', label: 'Toparlanır' };
  if (score >= 40) return { hex: '#f97316', label: 'Acil Bakım Gerekli' };
  return { hex: '#ef4444', label: 'Küllerinden Doğmalı' };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines.slice(0, maxLines);
}

export function ShareableRoastCard({ card, tone }: ShareableRoastCardProps) {
  const [downloading, setDownloading] = useState(false);
  const toneInfo = TONE_LABELS[tone];
  const accent = getScoreAccent(card.score);

  const handleDownloadPng = () => {
    setDownloading(true);
    try {
      const width = 1200;
      const height = 630;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, '#18181b');
      bg.addColorStop(0.55, '#1c1917');
      bg.addColorStop(1, '#29150e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle decorative glow
      const glow = ctx.createRadialGradient(width - 180, 120, 20, width - 180, 120, 380);
      glow.addColorStop(0, 'rgba(249, 115, 22, 0.22)');
      glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Outer border card frame
      drawRoundedRect(ctx, 36, 36, width - 72, height - 72, 28);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Header brand
      ctx.fillStyle = '#fb923c';
      ctx.font = '700 28px Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      ctx.fillText('CV ROAST TR', 80, 108);

      // Tone pill on top right
      const toneText = `TON: ${toneInfo.label.toUpperCase()}`;
      ctx.font = '600 20px Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      const toneWidth = ctx.measureText(toneText).width + 44;
      drawRoundedRect(ctx, width - 80 - toneWidth, 72, toneWidth, 48, 24);
      ctx.fillStyle = 'rgba(249, 115, 22, 0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fed7aa';
      ctx.fillText(toneText, width - 80 - toneWidth + 22, 103);

      // Score box on the left
      drawRoundedRect(ctx, 80, 175, 240, 260, 24);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = accent.hex;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = accent.hex;
      ctx.font = '800 104px Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      const scoreStr = String(card.score);
      const scoreWidth = ctx.measureText(scoreStr).width;
      ctx.fillText(scoreStr, 80 + (240 - scoreWidth) / 2, 305);

      ctx.fillStyle = '#a1a1aa';
      ctx.font = '600 24px Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      const outOfStr = '/ 100';
      const outOfWidth = ctx.measureText(outOfStr).width;
      ctx.fillText(outOfStr, 80 + (240 - outOfWidth) / 2, 348);

      ctx.fillStyle = '#e4e4e7';
      ctx.font = '600 20px Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      const statusWidth = ctx.measureText(accent.label).width;
      ctx.fillText(accent.label, 80 + (240 - statusWidth) / 2, 400);

      // Funniest line quote on the right (no PII, no CV quote)
      ctx.fillStyle = '#fb923c';
      ctx.font = '700 64px Georgia, serif';
      ctx.fillText('“', 368, 225);

      ctx.fillStyle = '#fafaf9';
      ctx.font = '600 34px Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      const lines = wrapTextLines(ctx, card.funniestLine, 720, 5);
      lines.forEach((line, idx) => {
        ctx.fillText(line, 376, 268 + idx * 48);
      });

      // Footer privacy stamp
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '500 20px Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      ctx.fillText(
        'Kişisel veri ve CV alıntısı içermez • Açık Kaynak Türkçe CV Eleştirmeni',
        80,
        548
      );

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `cv-roast-tr-${card.score}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-stone-900 to-ember-950 p-6 text-zinc-100 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-ember-400">
            <Flame className="h-4 w-4" />
            <span>CV ROAST TR</span>
          </div>
          <span className="rounded-full border border-ember-500/40 bg-ember-500/15 px-3 py-1 text-xs font-semibold text-ember-200">
            Ton: {toneInfo.label}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="flex shrink-0 flex-col items-center justify-center rounded-xl border-2 bg-white/5 px-6 py-4"
            style={{ borderColor: accent.hex }}
          >
            <span className="text-4xl font-extrabold leading-none" style={{ color: accent.hex }}>
              {card.score}
            </span>
            <span className="mt-1 text-xs font-medium text-zinc-400">/ 100</span>
            <span className="mt-2 text-xs font-semibold text-zinc-200">{accent.label}</span>
          </div>

          <blockquote className="text-base font-medium leading-relaxed text-stone-100 sm:text-lg">
            “{card.funniestLine}”
          </blockquote>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Kişisel veri veya CV alıntısı içermez — güvenle paylaşılabilir.</span>
          </p>
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg bg-ember-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-ember-600 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            <span>{downloading ? 'Hazırlanıyor...' : 'PNG Olarak İndir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
