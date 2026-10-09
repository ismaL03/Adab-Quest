/**
 * Les 28 lettres de l’alphabet arabe (+ la hamza), avec leur nom,
 * leur translittération et un repère d’articulation (makhraj) en français.
 */
export interface Letter {
  id: string;
  char: string;
  /** Nom arabe vocalisé. */
  nameAr: string;
  /** Nom en français. */
  name: string;
  /** Consonne translittérée (utilisée pour les syllabes). */
  translit: string;
  /** Repère de prononciation. */
  tip: string;
  /** Lettre d’élévation (isti‘lâ’) : toujours prononcée épaisse. */
  heavy?: boolean;
  /** Ne se lie pas à la lettre suivante. */
  nonConnector?: boolean;
  /** Lettre solaire (assimile le lâm de l’article). */
  solar?: boolean;
}

export const LETTERS: Letter[] = [
  { id: 'alif', char: 'ا', nameAr: 'أَلِف', name: 'Alif', translit: 'a', nonConnector: true, tip: 'Support de la hamza et voyelle longue « â ». Seul, il ne porte jamais de voyelle.' },
  { id: 'ba', char: 'ب', nameAr: 'بَاء', name: 'Bâ', translit: 'b', tip: '« b » français, prononcé avec les deux lèvres.' },
  { id: 'ta', char: 'ت', nameAr: 'تَاء', name: 'Tâ', translit: 't', solar: true, tip: '« t » léger : pointe de la langue contre la racine des incisives supérieures.' },
  { id: 'tha', char: 'ث', nameAr: 'ثَاء', name: 'Thâ', translit: 'th', solar: true, tip: '« th » de l’anglais « think » : pointe de la langue entre les dents.' },
  { id: 'jim', char: 'ج', nameAr: 'جِيم', name: 'Jîm', translit: 'j', tip: '« dj » : le milieu de la langue contre le palais.' },
  { id: 'hha', char: 'ح', nameAr: 'حَاء', name: 'Ḥâ', translit: 'ḥ', tip: '« h » soufflé du milieu de la gorge, sans raclement.' },
  { id: 'kha', char: 'خ', nameAr: 'خَاء', name: 'Khâ', translit: 'kh', heavy: true, tip: '« kh » comme la jota espagnole, du haut de la gorge.' },
  { id: 'dal', char: 'د', nameAr: 'دَال', name: 'Dâl', translit: 'd', nonConnector: true, solar: true, tip: '« d » français.' },
  { id: 'dhal', char: 'ذ', nameAr: 'ذَال', name: 'Dhâl', translit: 'dh', nonConnector: true, solar: true, tip: '« th » de l’anglais « this » : langue entre les dents, son vibré.' },
  { id: 'ra', char: 'ر', nameAr: 'رَاء', name: 'Râ', translit: 'r', nonConnector: true, solar: true, tip: '« r » roulé du bout de la langue, sans le faire vibrer trop longtemps.' },
  { id: 'zay', char: 'ز', nameAr: 'زَاي', name: 'Zây', translit: 'z', nonConnector: true, solar: true, tip: '« z » français.' },
  { id: 'sin', char: 'س', nameAr: 'سِين', name: 'Sîn', translit: 's', solar: true, tip: '« s » sifflant et léger.' },
  { id: 'shin', char: 'ش', nameAr: 'شِين', name: 'Shîn', translit: 'sh', solar: true, tip: '« ch » de « chat ».' },
  { id: 'sad', char: 'ص', nameAr: 'صَاد', name: 'Ṣâd', translit: 'ṣ', heavy: true, solar: true, tip: '« s » épais : langue relevée vers le palais, son plein et grave.' },
  { id: 'dad', char: 'ض', nameAr: 'ضَاد', name: 'Ḍâd', translit: 'ḍ', heavy: true, solar: true, tip: '« d » épais : les bords de la langue contre les molaires.' },
  { id: 'taa', char: 'ط', nameAr: 'طَاء', name: 'Ṭâ', translit: 'ṭ', heavy: true, solar: true, tip: '« t » épais et appuyé, langue relevée.' },
  { id: 'dhaa', char: 'ظ', nameAr: 'ظَاء', name: 'Ẓâ', translit: 'ẓ', heavy: true, solar: true, tip: '« dh » épais : langue entre les dents, son plein.' },
  { id: 'ayn', char: 'ع', nameAr: 'عَيْن', name: '‘Ayn', translit: '‘', tip: 'Son du milieu de la gorge, gorge resserrée : sans équivalent en français.' },
  { id: 'ghayn', char: 'غ', nameAr: 'غَيْن', name: 'Ghayn', translit: 'gh', heavy: true, tip: '« r » grasseyé parisien, du haut de la gorge.' },
  { id: 'fa', char: 'ف', nameAr: 'فَاء', name: 'Fâ', translit: 'f', tip: '« f » français : incisives supérieures sur la lèvre inférieure.' },
  { id: 'qaf', char: 'ق', nameAr: 'قَاف', name: 'Qâf', translit: 'q', heavy: true, tip: '« q » profond : fond de la langue contre le voile du palais.' },
  { id: 'kaf', char: 'ك', nameAr: 'كَاف', name: 'Kâf', translit: 'k', tip: '« k » français, un peu plus en avant que le qâf.' },
  { id: 'lam', char: 'ل', nameAr: 'لَام', name: 'Lâm', translit: 'l', solar: true, tip: '« l » français.' },
  { id: 'mim', char: 'م', nameAr: 'مِيم', name: 'Mîm', translit: 'm', tip: '« m » français, lèvres fermées.' },
  { id: 'nun', char: 'ن', nameAr: 'نُون', name: 'Nûn', translit: 'n', solar: true, tip: '« n » français.' },
  { id: 'ha', char: 'ه', nameAr: 'هَاء', name: 'Hâ', translit: 'h', tip: '« h » expiré et léger, du fond de la gorge (comme « hello »).' },
  { id: 'waw', char: 'و', nameAr: 'وَاو', name: 'Wâw', translit: 'w', nonConnector: true, tip: '« w » de « wow » ; aussi voyelle longue « oû ».' },
  { id: 'ya', char: 'ي', nameAr: 'يَاء', name: 'Yâ', translit: 'y', tip: '« y » de « yaourt » ; aussi voyelle longue « î ». Dans le Mushaf, le yâ’ final s’écrit sans points : ى.' },
];

export const HAMZA: Letter = {
  id: 'hamza',
  char: 'ء',
  nameAr: 'هَمْزَة',
  name: 'Hamza',
  translit: '’',
  nonConnector: true,
  tip: 'Coup de glotte : une brève fermeture de la gorge, comme dans « oh-oh ».',
};

export const ALL_LETTERS: Letter[] = [...LETTERS, HAMZA];

const BY_ID = new Map(ALL_LETTERS.map((l) => [l.id, l]));
const BY_CHAR = new Map(ALL_LETTERS.map((l) => [l.char, l]));

export function letter(id: string): Letter {
  const l = BY_ID.get(id);
  if (!l) throw new Error(`Lettre inconnue : ${id}`);
  return l;
}

export function letterByChar(char: string): Letter | undefined {
  return BY_CHAR.get(char);
}

export function letters(ids: readonly string[]): Letter[] {
  return ids.map(letter);
}

/** Familles de lettres qui partagent le même squelette (rasm). */
export const SHAPE_FAMILIES: string[][] = [
  ['ba', 'ta', 'tha', 'nun', 'ya'],
  ['jim', 'hha', 'kha'],
  ['dal', 'dhal'],
  ['ra', 'zay'],
  ['sin', 'shin'],
  ['sad', 'dad'],
  ['taa', 'dhaa'],
  ['ayn', 'ghayn'],
  ['fa', 'qaf'],
];

/** Paires de lettres proches à l’oreille (léger / épais, gorge…). */
export const SOUND_PAIRS: [string, string][] = [
  ['ta', 'taa'],
  ['sin', 'sad'],
  ['dal', 'dad'],
  ['dhal', 'dhaa'],
  ['kaf', 'qaf'],
  ['ha', 'hha'],
  ['hamza', 'ayn'],
  ['kha', 'ghayn'],
];
