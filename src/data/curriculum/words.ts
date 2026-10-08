import type { WordEntry } from './items';

/**
 * Vocabulaire de lecture, classé par notion. Orthographe vocalisée complète ;
 * les mots de l’article et du Coran respectent l’écriture uthmanie (ٱ, ـٰ).
 * Chaque mot attend un fichier audio : /public/audio/words/<slug>.mp3
 */
const w = (slug: string, ar: string, translit: string, fr: string): WordEntry => ({ slug, ar, translit, fr });

export const WORDS_SHORT_VOWELS: WordEntry[] = [
  w('kataba', 'كَتَبَ', 'kataba', 'il a écrit'),
  w('dhahaba', 'ذَهَبَ', 'dhahaba', 'il est parti'),
  w('jalasa', 'جَلَسَ', 'jalasa', 'il s’est assis'),
  w('fataha', 'فَتَحَ', 'fataḥa', 'il a ouvert'),
  w('khalaqa', 'خَلَقَ', 'khalaqa', 'il a créé'),
  w('nasara', 'نَصَرَ', 'naṣara', 'il a secouru'),
  w('samia', 'سَمِعَ', 'sami‘a', 'il a entendu'),
  w('alima', 'عَلِمَ', '‘alima', 'il a su'),
  w('razaqa', 'رَزَقَ', 'razaqa', 'il a pourvu'),
  w('shakara', 'شَكَرَ', 'shakara', 'il a remercié'),
  w('rusulu', 'رُسُلُ', 'rousoulou', 'les messagers'),
  w('kutubu', 'كُتُبُ', 'koutoubou', 'les livres'),
];

export const WORDS_SUKUN: WordEntry[] = [
  w('qul', 'قُلْ', 'qoul', 'dis'),
  w('lam', 'لَمْ', 'lam', 'ne… pas'),
  w('min', 'مِنْ', 'min', 'de'),
  w('an', 'عَنْ', '‘an', 'au sujet de'),
  w('qad', 'قَدْ', 'qad', 'certes'),
  w('hal', 'هَلْ', 'hal', 'est-ce que ?'),
  w('lakum', 'لَكُمْ', 'lakoum', 'pour vous'),
  w('yalid', 'يَلِدْ', 'yalid', 'il engendre'),
  w('nabudu', 'نَعْبُدُ', 'na‘boudou', 'nous adorons'),
  w('anamta', 'أَنْعَمْتَ', 'an‘amta', 'tu as comblé'),
  w('yalamu', 'يَعْلَمُ', 'ya‘lamou', 'il sait'),
  w('yakhluqu', 'يَخْلُقُ', 'yakhlouqou', 'il crée'),
];

export const WORDS_MADD: WordEntry[] = [
  w('qala', 'قَالَ', 'qâla', 'il a dit'),
  w('kana', 'كَانَ', 'kâna', 'il était'),
  w('nama', 'نَامَ', 'nâma', 'il a dormi'),
  w('qila', 'قِيلَ', 'qîla', 'il a été dit'),
  w('fihi', 'فِيهِ', 'fîhi', 'en lui'),
  w('dini', 'دِينِ', 'dîni', 'religion'),
  w('yaqulu', 'يَقُولُ', 'yaqoûlou', 'il dit'),
  w('nuru', 'نُورُ', 'noûrou', 'la lumière'),
  w('yusufu', 'يُوسُفُ', 'Yoûsoufou', 'Joseph'),
];

export const WORDS_DAGGER: WordEntry[] = [
  w('ar-rahmani', 'ٱلرَّحْمَٰنِ', 'ar-raḥmâni', 'le Tout Miséricordieux'),
  w('maliki', 'مَٰلِكِ', 'mâliki', 'Souverain'),
  w('al-alamina', 'ٱلْعَٰلَمِينَ', 'al-‘âlamîna', 'les mondes'),
  w('hadha', 'هَٰذَا', 'hâdhâ', 'ceci'),
  w('lahu', 'لَهُۥ', 'lahoû', 'à Lui'),
  w('bihi', 'بِهِۦ', 'bihî', 'par lui'),
];

export const WORDS_LIN: WordEntry[] = [
  w('yawmi', 'يَوْمِ', 'yawmi', 'jour'),
  w('baytun', 'بَيْتٌ', 'baytoun', 'une maison'),
  w('khawfin', 'خَوْفٍ', 'khawfin', 'peur'),
  w('quraysh', 'قُرَيْشٍ', 'Qourayshin', 'Quraysh'),
  w('sayfi', 'صَيْفِ', 'ṣayfi', 'été'),
  w('alayhim', 'عَلَيْهِمْ', '‘alayhim', 'sur eux'),
];

export const WORDS_TANWIN: WordEntry[] = [
  w('ahadun', 'أَحَدٌ', 'aḥadoun', 'un, unique'),
  w('waladun', 'وَلَدٌ', 'waladoun', 'un enfant'),
  w('qalamun', 'قَلَمٌ', 'qalamoun', 'un calame'),
  w('jabalun', 'جَبَلٌ', 'jabaloun', 'une montagne'),
  w('ilman', 'عِلْمًا', '‘ilman', 'une science'),
  w('rasulan', 'رَسُولًا', 'rasoûlan', 'un messager'),
  w('lahabin', 'لَهَبٍ', 'lahabin', 'des flammes'),
  w('samiun', 'سَمِيعٌ', 'samî‘oun', 'Celui qui entend'),
  w('alimun', 'عَلِيمٌ', '‘alîmoun', 'Omniscient'),
  w('ghafurun', 'غَفُورٌ', 'ghafoûroun', 'Pardonneur'),
  w('rahimun', 'رَحِيمٌ', 'raḥîmoun', 'Très Miséricordieux'),
];

export const WORDS_SHADDA: WordEntry[] = [
  w('rabbi', 'رَبِّ', 'rabbi', 'Seigneur'),
  w('thumma', 'ثُمَّ', 'thoumma', 'puis'),
  w('allama', 'عَلَّمَ', '‘allama', 'il a enseigné'),
  w('kalla', 'كَلَّا', 'kallâ', 'non !'),
  w('tabbat', 'تَبَّتْ', 'tabbat', 'qu’elles périssent'),
  w('haqqun', 'حَقٌّ', 'ḥaqqoun', 'une vérité'),
  w('muhammadun', 'مُحَمَّدٌ', 'Mouḥammadoun', 'Muhammad'),
];

export const WORDS_GHUNNA: WordEntry[] = [
  w('inna', 'إِنَّ', 'inna', 'certes'),
  w('innaa', 'إِنَّا', 'innâ', 'certes Nous'),
  w('amma', 'عَمَّ', '‘amma', 'sur quoi'),
  w('jannatun', 'جَنَّةٌ', 'jannatoun', 'un jardin'),
  w('ummatun', 'أُمَّةٌ', 'oummatoun', 'une communauté'),
  w('an-nasi', 'ٱلنَّاسِ', 'an-nâsi', 'les hommes'),
];

export const WORDS_QAMARI: WordEntry[] = [
  w('al-qamaru', 'ٱلْقَمَرُ', 'al-qamarou', 'la lune'),
  w('al-hamdu', 'ٱلْحَمْدُ', 'al-ḥamdou', 'la louange'),
  w('al-falaqi', 'ٱلْفَلَقِ', 'al-falaqi', 'l’aube naissante'),
  w('al-asri', 'ٱلْعَصْرِ', 'al-‘aṣri', 'le temps'),
  w('al-bayti', 'ٱلْبَيْتِ', 'al-bayti', 'la Maison'),
  w('al-ardu', 'ٱلْأَرْضُ', 'al-arḍou', 'la terre'),
  w('al-yawma', 'ٱلْيَوْمَ', 'al-yawma', 'aujourd’hui'),
  w('al-maliku', 'ٱلْمَلِكُ', 'al-malikou', 'le Roi'),
];

export const WORDS_SHAMSI: WordEntry[] = [
  w('ash-shamsu', 'ٱلشَّمْسُ', 'ash-shamsou', 'le soleil'),
  w('an-nasi', 'ٱلنَّاسِ', 'an-nâsi', 'les hommes'),
  w('ar-rahimi', 'ٱلرَّحِيمِ', 'ar-raḥîmi', 'le Très Miséricordieux'),
  w('ad-dini', 'ٱلدِّينِ', 'ad-dîni', 'la Rétribution'),
  w('as-samadu', 'ٱلصَّمَدُ', 'aṣ-ṣamadou', 'l’Absolu'),
  w('at-tini', 'ٱلتِّينِ', 'at-tîni', 'le figuier'),
  w('adh-dhikra', 'ٱلذِّكْرَ', 'adh-dhikra', 'le Rappel'),
  w('at-tariqi', 'ٱلطَّارِقِ', 'aṭ-ṭâriqi', 'l’astre nocturne'),
];

export const WORDS_WASL: WordEntry[] = [
  w('ihdina', 'ٱهْدِنَا', 'ihdinâ', 'guide-nous'),
  w('iqra', 'ٱقْرَأْ', 'iqra’', 'lis !'),
  w('bismi', 'بِسْمِ', 'bismi', 'au nom de'),
  w('bismi-llahi', 'بِسْمِ ٱللَّهِ', 'bismi-llâhi', 'au nom d’Allah'),
  w('wal-qamari', 'وَٱلْقَمَرِ', 'wal-qamari', 'et la lune'),
  w('wash-shamsi', 'وَٱلشَّمْسِ', 'wash-shamsi', 'et le soleil'),
];
