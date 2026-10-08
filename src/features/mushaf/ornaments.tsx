import { toArabicDigits } from '@/lib/arabic';
import { cn } from '@/lib/cn';

/**
 * Médaillon de fin de verset. Dans la police KFGQPC, les chiffres arabes-indiens
 * sont dessinés directement dans la rosace ornementale du Mushaf de Médine.
 */
export function AyahMarker({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn('font-quran mx-[0.1em] whitespace-nowrap text-gold', className)} aria-label={`Fin du verset ${n}`} dir="rtl">
      {toArabicDigits(n)}
    </span>
  );
}

/** Cartouche d’en-tête de sourate, à la manière des Mushafs imprimés. */
export function SurahBanner({ ar, subtitle }: { ar: string; subtitle?: string }) {
  return (
    <div className="relative mx-auto my-2 w-full max-w-xl">
      <svg viewBox="0 0 600 84" className="w-full text-gold" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="banner-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--gold-soft)" />
            <stop offset="1" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M60 6h480c10 0 16 8 22 14l32 22-32 22c-6 6-12 14-22 14H60c-10 0-16-8-22-14L6 42l32-22c6-6 12-14 22-14z"
          fill="url(#banner-fill)"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M66 14h468c7 0 12 6 17 10l24 18-24 18c-5 4-10 10-17 10H66c-7 0-12-6-17-10L25 42l24-18c5-4 10-10 17-10z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          opacity=".7"
        />
        <g fill="currentColor" opacity=".85">
          <circle cx="22" cy="42" r="3" />
          <circle cx="578" cy="42" r="3" />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span dir="rtl" lang="ar" className="font-quran text-[clamp(1.25rem,3.4vw,1.7rem)] leading-[1.4] text-paper-ink">
          {ar}
        </span>
      </div>
      {subtitle && <p className="mt-1 text-center text-xs font-semibold tracking-wide text-muted">{subtitle}</p>}
    </div>
  );
}

/** Coins décoratifs du cadre de page. */
export function PageCorners() {
  const corner = (
    <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M2 38V8a6 6 0 0 1 6-6h30" />
        <path d="M8 38V14a6 6 0 0 1 6-6h24" opacity=".6" />
        <path d="M14 14l5 5m0-5-5 5" opacity=".8" />
      </g>
    </svg>
  );
  return (
    <>
      <span className="pointer-events-none absolute top-2 left-2 size-9 text-gold">{corner}</span>
      <span className="pointer-events-none absolute top-2 right-2 size-9 rotate-90 text-gold">{corner}</span>
      <span className="pointer-events-none absolute right-2 bottom-2 size-9 rotate-180 text-gold">{corner}</span>
      <span className="pointer-events-none absolute bottom-2 left-2 size-9 -rotate-90 text-gold">{corner}</span>
    </>
  );
}
