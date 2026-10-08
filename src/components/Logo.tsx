import { cn } from '@/lib/cn';

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative grid size-10 place-items-center overflow-hidden rounded-[0.9rem] bg-gradient-to-br from-primary to-primary-strong shadow-[0_8px_20px_-8px_var(--primary)]">
        <svg viewBox="0 0 40 40" className="absolute inset-0 size-full text-gold-bright/70" aria-hidden>
          <path
            d="M20 4l3.5 5.2 6.2-1.5-1.5 6.2L33.4 17l-5.2 3.5 1.5 6.2-6.2-1.5L20 30.4l-3.5-5.2-6.2 1.5 1.5-6.2L6.6 17l5.2-3.5-1.5-6.2 6.2 1.5z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            transform="translate(0 3)"
          />
        </svg>
        <span dir="rtl" className="font-quran relative mt-1 text-[1.15rem] leading-none text-on-primary">
          ٱقْرَأْ
        </span>
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="font-display text-[1.35rem] font-semibold tracking-[-0.02em]">Iqra</p>
          <p className="mt-1 text-[0.66rem] font-semibold tracking-[0.14em] text-muted uppercase">Lire l’arabe</p>
        </div>
      )}
    </div>
  );
}
