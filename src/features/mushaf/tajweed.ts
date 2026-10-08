/**
 * Règles de Tajweed présentes dans les données (ordre = codes du fichier JSON).
 */
export const TAJWEED_RULES = [
  'ham_wasl',
  'laam_shamsiyah',
  'slnt',
  'madda_normal',
  'madda_permissible',
  'madda_obligatory',
  'madda_necessary',
  'qalaqah',
  'ghunnah',
  'ikhafa',
  'ikhafa_shafawi',
  'idgham_ghunnah',
  'idgham_wo_ghunnah',
  'idgham_shafawi',
  'iqlab',
  'idgham_mutajanisayn',
  'idgham_mutaqaribayn',
  'tafkhim',
  'tarqiq',
] as const;

export type TajweedRule = (typeof TAJWEED_RULES)[number];

export interface TajweedRuleInfo {
  id: TajweedRule;
  /** Nom de la règle en français. */
  label: string;
  /** Nom arabe. */
  ar: string;
  /** Explication courte. */
  description: string;
  /** Variable CSS de couleur (null = non colorée par défaut). */
  color: string | null;
  /** Groupe affiché dans la légende. */
  group: 'silent' | 'madd' | 'ghunna' | 'qalqala' | 'tafkhim' | 'other';
}

export const RULE_INFO: Record<TajweedRule, TajweedRuleInfo> = {
  ham_wasl: {
    id: 'ham_wasl',
    label: 'Hamzat al-wasl',
    ar: 'هَمْزَةُ ٱلْوَصْل',
    description: "Alif de liaison : il ne se prononce pas lorsqu'on enchaîne avec le mot précédent.",
    color: 'var(--tj-silent)',
    group: 'silent',
  },
  laam_shamsiyah: {
    id: 'laam_shamsiyah',
    label: 'Lâm solaire',
    ar: 'ٱللَّامُ ٱلشَّمْسِيَّة',
    description: "Le lâm de l'article s'assimile à la lettre solaire qui suit : il est écrit mais non prononcé.",
    color: 'var(--tj-silent)',
    group: 'silent',
  },
  slnt: {
    id: 'slnt',
    label: 'Lettre muette',
    ar: 'حَرْفٌ لَا يُنْطَق',
    description: 'Lettre écrite mais non prononcée.',
    color: 'var(--tj-silent)',
    group: 'silent',
  },
  madda_normal: {
    id: 'madda_normal',
    label: 'Madd naturel (2 temps)',
    ar: 'مَدٌّ طَبِيعِيّ',
    description: 'Allongement naturel de deux temps.',
    color: 'var(--tj-madd-2)',
    group: 'madd',
  },
  madda_permissible: {
    id: 'madda_permissible',
    label: 'Madd permis (2, 4 ou 6)',
    ar: 'مَدٌّ جَائِز',
    description: "Allongement facultatif : madd séparé ou madd dû à l'arrêt.",
    color: 'var(--tj-madd-246)',
    group: 'madd',
  },
  madda_obligatory: {
    id: 'madda_obligatory',
    label: 'Madd obligatoire (4 ou 5)',
    ar: 'مَدٌّ وَاجِب',
    description: 'Madd suivi d’une hamza dans le même mot : 4 ou 5 temps.',
    color: 'var(--tj-madd-45)',
    group: 'madd',
  },
  madda_necessary: {
    id: 'madda_necessary',
    label: 'Madd nécessaire (6)',
    ar: 'مَدٌّ لَازِم',
    description: 'Madd suivi d’un soukoun permanent : 6 temps.',
    color: 'var(--tj-madd-6)',
    group: 'madd',
  },
  qalaqah: {
    id: 'qalaqah',
    label: 'Qalqala',
    ar: 'قَلْقَلَة',
    description: 'Rebond sonore des lettres ق ط ب ج د lorsqu’elles portent un soukoun.',
    color: 'var(--tj-qalqala)',
    group: 'qalqala',
  },
  ghunnah: {
    id: 'ghunnah',
    label: 'Ghunna (nasalisation)',
    ar: 'غُنَّة',
    description: 'Nasalisation de deux temps sur le nûn et le mîm avec chadda.',
    color: 'var(--tj-ghunna)',
    group: 'ghunna',
  },
  ikhafa: {
    id: 'ikhafa',
    label: 'Ikhfâ’ (dissimulation)',
    ar: 'إِخْفَاء',
    description: 'Le nûn sâkin ou le tanwîn est prononcé de façon voilée, avec ghunna.',
    color: 'var(--tj-ikhfa)',
    group: 'ghunna',
  },
  ikhafa_shafawi: {
    id: 'ikhafa_shafawi',
    label: 'Ikhfâ’ labial',
    ar: 'إِخْفَاءٌ شَفَوِيّ',
    description: 'Mîm sâkin suivi d’un bâ’ : dissimulation avec ghunna.',
    color: 'var(--tj-ikhfa)',
    group: 'ghunna',
  },
  idgham_ghunnah: {
    id: 'idgham_ghunnah',
    label: 'Idghâm avec ghunna',
    ar: 'إِدْغَامٌ بِغُنَّة',
    description: 'Le nûn sâkin ou le tanwîn fusionne dans ي ن م و avec nasalisation.',
    color: 'var(--tj-idgham)',
    group: 'ghunna',
  },
  idgham_wo_ghunnah: {
    id: 'idgham_wo_ghunnah',
    label: 'Idghâm sans ghunna',
    ar: 'إِدْغَامٌ بِلَا غُنَّة',
    description: 'Le nûn sâkin ou le tanwîn fusionne totalement dans ل ou ر.',
    color: 'var(--tj-idgham-no)',
    group: 'other',
  },
  idgham_shafawi: {
    id: 'idgham_shafawi',
    label: 'Idghâm labial',
    ar: 'إِدْغَامٌ شَفَوِيّ',
    description: 'Mîm sâkin suivi d’un mîm : fusion avec ghunna.',
    color: 'var(--tj-idgham)',
    group: 'ghunna',
  },
  iqlab: {
    id: 'iqlab',
    label: 'Iqlâb (conversion)',
    ar: 'إِقْلَاب',
    description: 'Le nûn sâkin ou le tanwîn devant un bâ’ se transforme en mîm.',
    color: 'var(--tj-iqlab)',
    group: 'ghunna',
  },
  idgham_mutajanisayn: {
    id: 'idgham_mutajanisayn',
    label: 'Idghâm de lettres homorganiques',
    ar: 'إِدْغَامُ ٱلْمُتَجَانِسَيْن',
    description: 'Deux lettres de même point d’articulation : la première s’assimile.',
    color: 'var(--tj-idgham-no)',
    group: 'other',
  },
  idgham_mutaqaribayn: {
    id: 'idgham_mutaqaribayn',
    label: 'Idghâm de lettres proches',
    ar: 'إِدْغَامُ ٱلْمُتَقَارِبَيْن',
    description: 'Deux lettres d’articulation voisine : la première s’assimile.',
    color: 'var(--tj-idgham-no)',
    group: 'other',
  },
  tafkhim: {
    id: 'tafkhim',
    label: 'Tafkhîm (emphase)',
    ar: 'تَفْخِيم',
    description: 'Lettre prononcée épaisse, bouche arrondie (lettres d’élévation, râ’ emphatique).',
    color: 'var(--tj-tafkhim)',
    group: 'tafkhim',
  },
  tarqiq: {
    id: 'tarqiq',
    label: 'Tarqîq (finesse)',
    ar: 'تَرْقِيق',
    description: 'Lettre prononcée fine et légère.',
    color: null,
    group: 'tafkhim',
  },
};

/** Priorité d’affichage lorsqu’un segment porte plusieurs règles. */
const PRIORITY: TajweedRule[] = [
  'madda_necessary',
  'madda_obligatory',
  'madda_permissible',
  'madda_normal',
  'qalaqah',
  'iqlab',
  'idgham_ghunnah',
  'idgham_shafawi',
  'ikhafa',
  'ikhafa_shafawi',
  'ghunnah',
  'idgham_wo_ghunnah',
  'idgham_mutajanisayn',
  'idgham_mutaqaribayn',
  'ham_wasl',
  'laam_shamsiyah',
  'slnt',
  'tafkhim',
  'tarqiq',
];

export interface ColorOptions {
  /** Affiche aussi l’emphase (tafkhîm), désactivée par défaut comme dans les mushafs classiques. */
  showTafkhim?: boolean;
}

export function resolveRuleColor(rules: readonly TajweedRule[], options: ColorOptions = {}): string | null {
  for (const rule of PRIORITY) {
    if (!rules.includes(rule)) continue;
    if (rule === 'tafkhim' && !options.showTafkhim) continue;
    const color = RULE_INFO[rule].color;
    if (color) return color;
  }
  return null;
}

export function decodeRules(codes: readonly number[]): TajweedRule[] {
  return codes.map((c) => TAJWEED_RULES[c]).filter(Boolean);
}
