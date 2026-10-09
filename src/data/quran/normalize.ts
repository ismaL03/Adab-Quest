/**
 * Forme de comparaison d’un mot coranique : NFC, sans tatweel ni signes de
 * pause, chadda toujours placée avant la voyelle.
 */
export function normalizeQuranText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[ـ‌‍ۖ-ۜ۞۩]/g, '')
    .replace(/([ً-ِ])(ّ)/g, '$2$1')
    .trim();
}
