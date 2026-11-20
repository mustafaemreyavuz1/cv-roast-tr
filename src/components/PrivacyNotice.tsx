import { ShieldCheck } from 'lucide-react';

export function PrivacyNotice() {
  return (
    <section
      aria-label="KVKK ve Gizlilik Bildirimi"
      className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
    >
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="space-y-1">
          <h2 className="font-semibold text-emerald-900 dark:text-emerald-200">
            Önce Gizlilik &amp; KVKK Güvencesi
          </h2>
          <p className="leading-relaxed text-emerald-900/90 dark:text-emerald-200/85">
            CV’niz diske yazılmaz, veritabanına kaydedilmez ve loglanmaz. Metin yapay zekaya
            gönderilmeden önce <strong>e-posta, telefon, TC kimlik no, IBAN, link ve açık adres</strong>{' '}
            bilgileri otomatik olarak maskelenir (<code className="font-mono text-xs">[TELEFON]</code>,{' '}
            <code className="font-mono text-xs">[E-POSTA]</code> vb.). Kendi API anahtarınızı
            girerseniz yalnızca bu istek süresince bellekte kullanılır ve asla saklanmaz.
          </p>
        </div>
      </div>
    </section>
  );
}
