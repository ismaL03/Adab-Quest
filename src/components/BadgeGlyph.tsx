import { cn } from '@/lib/cn';

/** Glyphe arabe d’un badge, dont la taille s’adapte à la longueur. */
export function BadgeGlyph({ glyph, className }: { glyph: string; className?: string }) {
  const len = Array.from(glyph.replace(/[\u064B-\u065F\u0670\s]/g, '')).length;
  const size = len <= 1 ? 'text-2xl' : len <= 2 ? 'text-xl' : len <= 4 ? 'text-base' : 'text-sm';
  return (
    <span dir="rtl" className={cn('font-quran leading-none whitespace-nowrap', size, className)}>
      {glyph}
    </span>
  );
}
