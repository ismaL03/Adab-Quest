/**
 * Convertit l’écriture uthmanie (Mushaf) en arabe vocalisé « standard »,
 * lisible correctement par un moteur de synthèse vocale (espeak / Piper,
 * voix arabes des navigateurs). Le texte affiché, lui, ne change pas.
 *
 *   ٱلْحَمْدُ   → اَلْحَمْدُ      (alif de liaison prononcé en début de mot)
 *   ٱلرَّحْمَـٰنِ → اَرَّحْمَانِ   (lâm solaire assimilé, alif suscrit → alif)
 *   وَٱلشَّمْسِ  → وَشَّمْسِ      (alif de liaison muet en milieu de mot)
 *   لَهُۥ       → لَهُو           (petit wâw → wâw de prolongation)
 *   قَالُوا     → قَالُو          (alif muet après le wâw du pluriel)
 *   هَمْزَة     → هَمْزَه          (tâ’ marbûta à la pause)
 */

const SHADDA = 'ّ';
const SUKUN = 'ْ';
const DAGGER_ALIF = 'ٰ';
const VOWELS = new Set(['ً', 'ٌ', 'ٍ', 'َ', 'ُ', 'ِ']);

/** Signes à supprimer : pauses, ornements, petits signes de lecture. */
const DROP = /[ـ‌‍ٓۖ-ۜ۝۞ۣۢۧۨ۩۪-ۭ]/g;
/** Marque de lettre muette (petit zéro) : la lettre qui la porte n’est pas prononcée. */
const SILENT = /[۟۠]/;
const OPEN_TANWIN: Record<string, string> = { 'ࣰ': 'ً', 'ࣱ': 'ٌ', 'ࣲ': 'ٍ' };

const isMark = (ch: string) => /\p{M}/u.test(ch);

interface G {
  base: string;
  marks: string[];
}

function toGraphemes(word: string): G[] {
  const out: G[] = [];
  for (const ch of Array.from(word)) {
    if (isMark(ch) && out.length) out[out.length - 1].marks.push(ch);
    else out.push({ base: ch, marks: [] });
  }
  return out;
}

const render = (gs: G[]) =>
  gs
    .map((g) => {
      // Chadda d’abord, puis la voyelle : ordre attendu par les moteurs de synthèse.
      const marks = [...g.marks].sort((a, b) => (a === SHADDA ? -1 : b === SHADDA ? 1 : 0));
      return g.base + marks.join('');
    })
    .join('');

function normalizeWord(raw: string): string {
  // Hamza « sans support » (ـَٔ / ـٕ) : devient une hamza ء portant ses voyelles.
  let word = raw.replace(/ـ?([ً-ْ]*)[ٕٔ]([ً-ْ]*)/g, 'ء$1$2');
  word = word.replace(DROP, '').replace(/[ࣰ-ࣲ]/g, (c) => OPEN_TANWIN[c]);
  word = word.replace(/ۡ/g, SUKUN).replace(/ۥ/g, 'و').replace(/ۦ/g, 'ي');
  let gs = toGraphemes(word).filter((g) => !g.marks.some((m) => SILENT.test(m)));

  // Alif suscrit → alif de prolongation (ىٰ / ٮٰ deviennent un simple alif).
  const expanded: G[] = [];
  for (const g of gs) {
    if (!g.marks.includes(DAGGER_ALIF)) {
      expanded.push(g);
      continue;
    }
    const marks = g.marks.filter((m) => m !== DAGGER_ALIF);
    if (g.base === 'ى' || g.base === 'ٮ') expanded.push({ base: 'ا', marks });
    else {
      expanded.push({ base: g.base, marks });
      expanded.push({ base: 'ا', marks: [] });
    }
  }
  gs = expanded;

  // Alif de liaison (ٱ).
  gs = gs.flatMap((g, i): G[] => {
    if (g.base !== 'ٱ') return [g];
    if (i > 0) return []; // muet en milieu de mot : وَٱلْقَمَرِ → وَلْقَمَرِ
    if (gs[1]?.base === 'ل') return [{ base: 'ا', marks: ['َ'] }]; // article : « a »
    const third = gs[2];
    return [{ base: 'ا', marks: [third?.marks.includes('ُ') ? 'ُ' : 'ِ'] }];
  });

  // Lâm solaire : lâm sans signe suivi d’une lettre à chadda → assimilé.
  gs = gs.filter((g, i) => {
    if (g.base !== 'ل' || g.marks.length) return true;
    const next = gs[i + 1];
    const prev = gs[i - 1];
    return !(next?.marks.includes(SHADDA) && (prev?.base === 'ا' || i === 0 || prev?.marks.length));
  });

  // Alif muet après le wâw du pluriel : قَالُوا → قَالُو
  const last = gs[gs.length - 1];
  const beforeLast = gs[gs.length - 2];
  if (last?.base === 'ا' && !last.marks.length && beforeLast?.base === 'و' && !beforeLast.marks.some((m) => VOWELS.has(m))) {
    gs = gs.slice(0, -1);
  }

  // Tâ’ marbûta sans voyelle en fin de mot : prononcée « h » à la pause.
  const end = gs[gs.length - 1];
  if (end?.base === 'ة' && !end.marks.some((m) => VOWELS.has(m))) gs[gs.length - 1] = { base: 'ه', marks: [SUKUN] };

  return lengthenAllah(render(gs));
}

/**
 * Le nom « Allâh » s’écrit sans alif dans le Mushaf (ٱللَّه) mais se prononce
 * avec un « â » long : اَللَّهُ, لِلَّهِ, بِٱللَّهِ, وَٱللَّهُ, ٱللَّهُمَّ…
 */
const ALLAH = /^((?:[وف]\u064E)?(?:ا\u064E|[بل]\u0650|ت\u064E)?ل\u0651\u064E)(ه[\u064E\u064F\u0650]?(?:م\u0651\u064E)?)$/;

function lengthenAllah(word: string): string {
  return word.replace(ALLAH, '$1ا$2');
}

export function toSpeechText(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeWord)
    .filter(Boolean)
    .join(' ');
}
