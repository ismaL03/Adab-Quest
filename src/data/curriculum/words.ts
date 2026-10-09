import type { WordEntry } from './items';

/**
 * Vocabulaire de lecture, leçon par leçon.
 *
 * Règle de la méthode : un mot n’utilise que des lettres et des signes déjà
 * étudiés (vérifié par les tests). Dès que possible, on retient l’orthographe
 * exacte d’un mot du Coran : il est alors lu par la récitation mot à mot de
 * Quran.com (`npm run quran:words`), une vraie voix humaine.
 * Les mots sans occurrence identique attendent /public/audio/words/<slug>.mp3.
 */
const w = (slug: string, ar: string, translit: string, fr: string): WordEntry => ({ slug, ar, translit, fr });

/** Mots-clés illustrant chaque lettre (comme l’image en tête de leçon du livre). */
export const KEYWORDS: Record<string, WordEntry> = {
  ba: w('kw-bab', 'بَابٌ', 'bâboun', 'une porte'),
  ta: w('kw-tut', 'تُوتٌ', 'toûtoun', 'des mûres'),
  tha: w('kw-thawb', 'ثَوْبٌ', 'thawboun', 'un vêtement'),
  nun: w('kw-nahla', 'نَحْلَةٌ', 'naḥlatoun', 'une abeille'),
  ya: w('kw-yad', 'يَدٌ', 'yadoun', 'une main'),
  ra: w('kw-rumman', 'رُمَّانٌ', 'roummânoun', 'des grenades'),
  dal: w('kw-dajaja', 'دَجَاجَةٌ', 'dajâjatoun', 'une poule'),
  waw: w('kw-warda', 'وَرْدَةٌ', 'wardatoun', 'une rose'),
  zay: w('kw-zaytun', 'زَيْتُونٌ', 'zaytoûnoun', 'des olives'),
  dhal: w('kw-dhahab', 'ذَهَبٌ', 'dhahaboun', 'de l’or'),
  mim: w('kw-mawz', 'مَوْزٌ', 'mawzoun', 'des bananes'),
  lam: w('kw-laymun', 'لَيْمُونٌ', 'laymoûnoun', 'des citrons'),
  kaf: w('kw-kitab', 'كِتَابٌ', 'kitâboun', 'un livre'),
  ha: w('kw-hilal', 'هِلَالٌ', 'hilâloun', 'un croissant de lune'),
  sin: w('kw-samak', 'سَمَكٌ', 'samakoun', 'des poissons'),
  shin: w('kw-shams', 'شَمْسٌ', 'shamsoun', 'un soleil'),
  qaf: w('kw-qamar', 'قَمَرٌ', 'qamaroun', 'une lune'),
  jim: w('kw-jamal', 'جَمَلٌ', 'jamaloun', 'un chameau'),
  hha: w('kw-hisan', 'حِصَانٌ', 'ḥiṣânoun', 'un cheval'),
  kha: w('kw-khubz', 'خُبْزٌ', 'khoubzoun', 'du pain'),
  fa: w('kw-fawakih', 'فَوَاكِهُ', 'fawâkihou', 'des fruits'),
  ayn: w('kw-inab', 'عِنَبٌ', '‘inaboun', 'du raisin'),
  ghayn: w('kw-ghazal', 'غَزَالٌ', 'ghazâloun', 'une gazelle'),
  sad: w('kw-saqr', 'صَقْرٌ', 'ṣaqroun', 'un faucon'),
  dad: w('kw-difda', 'ضِفْدَعٌ', 'ḍifda‘oun', 'une grenouille'),
  taa: w('kw-tair', 'طَائِرٌ', 'ṭâ’iroun', 'un oiseau'),
  dhaa: w('kw-zarf', 'ظَرْفٌ', 'ẓarfoun', 'une enveloppe'),
};

/** Mots des leçons, indexés par identifiant de leçon. */
export const LESSON_WORDS: Record<string, WordEntry[]> = {
  /* ── Le système ─────────────────────────────────────────────────────── */
  ba: [w('baba', 'بَابَا', 'bâbâ', 'papa')],

  /* ── La famille du bâ’ ──────────────────────────────────────────────── */
  ta: [
    w('taba', 'تَابَ', 'tâba', 'il s’est repenti'),
    w('tubtu', 'تُبْتُ', 'toubtou', 'je me suis repenti'),
    w('bata', 'بَاتَ', 'bâta', 'il a passé la nuit'),
    w('tut', 'تُوتْ', 'toût', 'des mûres'),
    w('baba', 'بَابَا', 'bâbâ', 'papa'),
  ],
  tha: [
    w('thabata', 'ثَبَتَ', 'thabata', 'il est resté ferme'),
    w('thabit', 'ثَابِتْ', 'thâbit', 'ferme, stable'),
    w('tathbit', 'تَثْبِيتْ', 'tathbît', 'affermissement'),
    w('taba', 'تَابَ', 'tâba', 'il s’est repenti'),
  ],
  nun: [
    w('banuna', 'بَنُونَ', 'banoûna', 'des fils'),
    w('nabata', 'نَبَاتَ', 'nabâta', 'la végétation (de)'),
    w('nabata-v', 'نَبَتَ', 'nabata', 'il a poussé'),
    w('bint', 'بِنْتْ', 'bint', 'une fille'),
    w('tin', 'تِينْ', 'tîn', 'des figues'),
    w('banat', 'بَنَاتْ', 'banât', 'des filles'),
  ],
  ya: [
    w('bayna', 'بَيْنَ', 'bayna', 'entre'),
    w('yatubu', 'يَتُوبُ', 'yatoûbou', 'il se repent'),
    w('bayt', 'بَيْتْ', 'bayt', 'une maison'),
    w('bayan', 'بَيَانْ', 'bayân', 'la clarté'),
    w('yabitu', 'يَبِيتُ', 'yabîtou', 'il passe la nuit'),
  ],
  tanwin: [
    w('baytun', 'بَيْتٌ', 'baytoun', 'une maison'),
    w('bayanun', 'بَيَانٌ', 'bayânoun', 'un exposé clair'),
    w('thabitun', 'ثَابِتٌ', 'thâbitoun', 'ferme'),
    w('nabatan', 'نَبَاتًا', 'nabâtan', 'une végétation'),
    w('buyutan', 'بُيُوتًا', 'bouyoûtan', 'des maisons'),
    w('banatin', 'بَنَاتٍ', 'banâtin', 'des filles'),
    w('bintun', 'بِنْتٌ', 'bintoun', 'une fille'),
  ],

  /* ── Les lettres qui ne s’attachent pas ─────────────────────────────── */
  ra: [
    w('narun', 'نَارٌ', 'nâroun', 'un feu'),
    w('nurun', 'نُورٌ', 'noûroun', 'une lumière'),
    w('turabun', 'تُرَابٌ', 'tourâboun', 'de la terre'),
    w('naran', 'نَارًا', 'nâran', 'un feu'),
    w('nuran', 'نُورًا', 'noûran', 'une lumière'),
  ],
  dal: [
    w('dinan', 'دِينًا', 'dînan', 'une religion'),
    w('baridun', 'بَارِدٌ', 'bâridoun', 'frais'),
    w('baradin', 'بَرَدٍ', 'baradin', 'de la grêle'),
    w('yuridu', 'يُرِيدُ', 'yourîdou', 'il veut'),
    w('daru', 'دَارُ', 'dârou', 'la demeure (de)'),
    w('duna', 'دُونَ', 'doûna', 'en dessous de'),
  ],
  waw: [
    w('wadudun', 'وَدُودٌ', 'wadoûdoun', 'Plein d’amour'),
    w('warada', 'وَرَدَ', 'warada', 'il est arrivé'),
    w('wadin', 'وَادٍ', 'wâdin', 'une vallée'),
    w('thawbun', 'ثَوْبٌ', 'thawboun', 'un vêtement'),
    w('dawrun', 'دَوْرٌ', 'dawroun', 'un tour'),
  ],
  zay: [
    w('zaydun', 'زَيْدٌ', 'zaydoun', 'Zayd'),
    w('yazidu', 'يَزِيدُ', 'yazîdou', 'il augmente'),
    w('waziran', 'وَزِيرًا', 'wazîran', 'un ministre'),
    w('zaytun', 'زَيْتٌ', 'zaytoun', 'de l’huile'),
    w('zaynabu', 'زَيْنَبُ', 'zaynabou', 'Zaynab'),
  ],
  dhal: [
    w('dhubaban', 'ذُبَابًا', 'dhoubâban', 'une mouche'),
    w('nadhirun', 'نَذِيرٌ', 'nadhîroun', 'un avertisseur'),
    w('dha', 'ذَا', 'dhâ', 'ce, celui'),
    w('dhu', 'ذُو', 'dhoû', 'doté de'),
    w('dhanbun', 'ذَنْبٌ', 'dhanboun', 'un péché'),
  ],

  /* ── Les lettres les plus fréquentes ────────────────────────────────── */
  mim: [
    w('min', 'مِنْ', 'min', 'de'),
    w('yawmun', 'يَوْمٌ', 'yawmoun', 'un jour'),
    w('maryama', 'مَرْيَمَ', 'maryama', 'Marie'),
    w('thamarun', 'ثَمَرٌ', 'thamaroun', 'des fruits'),
    w('daman', 'دَمًا', 'daman', 'du sang'),
    w('mawtan', 'مَوْتًا', 'mawtan', 'une mort'),
  ],
  lam: [
    w('la', 'لَا', 'lâ', 'non'),
    w('lam', 'لَمْ', 'lam', 'ne… pas'),
    w('lana', 'لَنَا', 'lanâ', 'pour nous'),
    w('waladun', 'وَلَدٌ', 'waladoun', 'un enfant'),
    w('malun', 'مَالٌ', 'mâloun', 'des biens'),
    w('baladin', 'بَلَدٍ', 'baladin', 'une contrée'),
    w('mithlu', 'مِثْلُ', 'mithlou', 'semblable à'),
  ],
  chadda: [
    w('rabbi', 'رَبِّ', 'rabbi', 'Seigneur'),
    w('thumma', 'ثُمَّ', 'thoumma', 'puis'),
    w('lamma', 'لَمَّا', 'lammâ', 'lorsque'),
    w('nazzala', 'نَزَّلَ', 'nazzala', 'il a fait descendre'),
    w('madda', 'مَدَّ', 'madda', 'il a étendu'),
    w('tawwaban', 'تَوَّابًا', 'tawwâban', 'Celui qui accueille le repentir'),
  ],
  kaf: [
    w('kana', 'كَانَ', 'kâna', 'il était'),
    w('lakum', 'لَكُمْ', 'lakoum', 'pour vous'),
    w('kataba', 'كَتَبَ', 'kataba', 'il a écrit'),
    w('kabirun', 'كَبِيرٌ', 'kabîroun', 'grand'),
    w('karimun', 'كَرِيمٌ', 'karîmoun', 'généreux'),
    w('kullu', 'كُلُّ', 'koullou', 'chaque'),
    w('maliki', 'مَلِكِ', 'maliki', 'le Roi (de)'),
  ],
  ha: [
    w('huwa', 'هُوَ', 'houwa', 'il, lui'),
    w('hal', 'هَلْ', 'hal', 'est-ce que ?'),
    w('hum', 'هُمْ', 'houm', 'eux'),
    w('lahum', 'لَهُمْ', 'lahoum', 'pour eux'),
    w('minhum', 'مِنْهُمْ', 'minhoum', 'parmi eux'),
    w('naharan', 'نَهَرًا', 'naharan', 'une rivière'),
    w('halaka', 'هَلَكَ', 'halaka', 'il a péri'),
  ],
  'ta-marbuta': [
    w('laylati', 'لَيْلَةِ', 'laylati', 'la nuit (de)'),
    w('kalimatun', 'كَلِمَةٌ', 'kalimatoun', 'une parole'),
    w('kalimatan', 'كَلِمَةً', 'kalimatan', 'une parole'),
    w('tawbatan', 'تَوْبَةً', 'tawbatan', 'un repentir'),
    w('zinatan', 'زِينَةً', 'zînatan', 'une parure'),
    w('wardatan', 'وَرْدَةً', 'wardatan', 'une rose'),
  ],
  sin: [
    w('rasulun', 'رَسُولٌ', 'rasoûloun', 'un messager'),
    w('suratun', 'سُورَةٌ', 'soûratoun', 'une sourate'),
    w('sabili', 'سَبِيلِ', 'sabîli', 'le chemin (de)'),
    w('sanatin', 'سَنَةٍ', 'sanatin', 'une année'),
    w('lisanun', 'لِسَانٌ', 'lisânoun', 'une langue'),
  ],
  shin: [
    w('shahru', 'شَهْرُ', 'shahrou', 'le mois (de)'),
    w('basharun', 'بَشَرٌ', 'basharoun', 'un être humain'),
    w('shakara', 'شَكَرَ', 'shakara', 'il a remercié'),
    w('shukran', 'شُكْرًا', 'shoukran', 'une gratitude'),
    w('yashkuru', 'يَشْكُرُ', 'yashkourou', 'il remercie'),
    w('shamsan', 'شَمْسًا', 'shamsan', 'un soleil'),
  ],

  /* ── Les lettres de la gorge, la hamza ──────────────────────────────── */
  qaf: [
    w('qul', 'قُلْ', 'qoul', 'dis'),
    w('qala', 'قَالَ', 'qâla', 'il a dit'),
    w('yaqulu', 'يَقُولُ', 'yaqoûlou', 'il dit'),
    w('qawmun', 'قَوْمٌ', 'qawmoun', 'un peuple'),
    w('qalbun', 'قَلْبٌ', 'qalboun', 'un cœur'),
    w('qabla', 'قَبْلَ', 'qabla', 'avant'),
    w('qaryatin', 'قَرْيَةٍ', 'qaryatin', 'une cité'),
  ],
  jim: [
    w('rajulun', 'رَجُلٌ', 'rajouloun', 'un homme'),
    w('jabalin', 'جَبَلٍ', 'jabalin', 'une montagne'),
    w('jibalin', 'جِبَالٍ', 'jibâlin', 'des montagnes'),
    w('jannatun', 'جَنَّةٌ', 'jannatoun', 'un jardin'),
    w('zawjin', 'زَوْجٍ', 'zawjin', 'un couple'),
  ],
  hha: [
    w('rahimun', 'رَحِيمٌ', 'raḥîmoun', 'Très Miséricordieux'),
    w('halimun', 'حَلِيمٌ', 'ḥalîmoun', 'Indulgent'),
    w('muhammadun', 'مُحَمَّدٌ', 'mouḥammadoun', 'Muhammad'),
    w('bahrin', 'بَحْرٍ', 'baḥrin', 'une mer'),
    w('hasanatan', 'حَسَنَةً', 'ḥasanatan', 'une bonne action'),
    w('nuhun', 'نُوحٌ', 'noûḥoun', 'Noé'),
  ],
  kha: [
    w('khayrun', 'خَيْرٌ', 'khayroun', 'un bien'),
    w('khalaqa', 'خَلَقَ', 'khalaqa', 'il a créé'),
    w('khabirun', 'خَبِيرٌ', 'khabîroun', 'Parfaitement informé'),
    w('yakhluqu', 'يَخْلُقُ', 'yakhlouqou', 'il crée'),
    w('khubzan', 'خُبْزًا', 'khoubzan', 'du pain'),
  ],
  hamza: [
    w('ahadun', 'أَحَدٌ', 'aḥadoun', 'un, unique'),
    w('inna', 'إِنَّ', 'inna', 'certes'),
    w('muminun', 'مُؤْمِنٌ', 'mou’minoun', 'un croyant'),
    w('saala', 'سَأَلَ', 'sa’ala', 'il a demandé'),
    w('ummu', 'أُمُّ', 'oummou', 'la mère (de)'),
    w('aban', 'أَبًا', 'aban', 'un père'),
  ],
  'alif-maqsura': [
    w('hudan', 'هُدًى', 'houdan', 'une guidée'),
    w('ila', 'إِلَى', 'ilâ', 'vers'),
    w('musa', 'مُوسَى', 'moûsâ', 'Moïse'),
    w('mawla', 'مَوْلَى', 'mawlâ', 'un protecteur'),
    w('bala', 'بَلَى', 'balâ', 'mais si !'),
    w('mata', 'مَتَى', 'matâ', 'quand ?'),
  ],

  /* ── L’article, le fâ’, l’alif de liaison ───────────────────────────── */
  fa: [
    w('fihi', 'فِيهِ', 'fîhi', 'en lui'),
    w('fawqa', 'فَوْقَ', 'fawqa', 'au-dessus de'),
    w('nafsun', 'نَفْسٌ', 'nafsoun', 'une âme'),
    w('yusufu', 'يُوسُفُ', 'yoûsoufou', 'Joseph'),
    w('fataha', 'فَتَحَ', 'fataḥa', 'il a ouvert'),
    w('khawfun', 'خَوْفٌ', 'khawfoun', 'une peur'),
    w('al-falaqi', 'ٱلْفَلَقِ', 'al-falaqi', 'l’aube naissante'),
  ],
  wasl: [
    w('ihdina', 'ٱهْدِنَا', 'ihdinâ', 'guide-nous'),
    w('iqra', 'ٱقْرَأْ', 'iqra’', 'lis !'),
    w('bismi', 'بِسْمِ', 'bismi', 'au nom de'),
    w('bismi-llahi', 'بِسْمِ ٱللَّهِ', 'bismi-llâhi', 'au nom d’Allah'),
    w('wal-qamari', 'وَٱلْقَمَرِ', 'wal-qamari', 'et la lune'),
    w('wash-shamsi', 'وَٱلشَّمْسِ', 'wash-shamsi', 'et le soleil'),
  ],

  /* ── Les dernières lettres ──────────────────────────────────────────── */
  ayn: [
    w('ala', 'عَلَى', '‘alâ', 'sur'),
    w('maa', 'مَعَ', 'ma‘a', 'avec'),
    w('naam', 'نَعَمْ', 'na‘am', 'oui'),
    w('ilmun', 'عِلْمٌ', '‘ilmoun', 'une science'),
    w('aynun', 'عَيْنٌ', '‘aynoun', 'une source'),
    w('yalamu', 'يَعْلَمُ', 'ya‘lamou', 'il sait'),
    w('samiun', 'سَمِيعٌ', 'samî‘oun', 'Celui qui entend tout'),
  ],
  ghayn: [
    w('ghafurun', 'غَفُورٌ', 'ghafoûroun', 'Pardonneur'),
    w('ghayri', 'غَيْرِ', 'ghayri', 'autre que'),
    w('yaghfiru', 'يَغْفِرُ', 'yaghfirou', 'il pardonne'),
    w('al-ghaybi', 'ٱلْغَيْبِ', 'al-ghaybi', 'l’invisible'),
    w('balagha', 'بَلَغَ', 'balagha', 'il a atteint'),
    w('ghanamu', 'غَنَمُ', 'ghanamou', 'les moutons (de)'),
  ],
  sad: [
    w('sadaqa', 'صَدَقَ', 'ṣadaqa', 'il a dit vrai'),
    w('basirun', 'بَصِيرٌ', 'baṣîroun', 'Clairvoyant'),
    w('sabran', 'صَبْرًا', 'ṣabran', 'une patience'),
    w('nasru', 'نَصْرُ', 'naṣrou', 'le secours (de)'),
    w('suratin', 'صُورَةٍ', 'ṣoûratin', 'une forme'),
    w('as-samadu', 'ٱلصَّمَدُ', 'aṣ-ṣamadou', 'l’Absolu'),
  ],
  dad: [
    w('daraba', 'ضَرَبَ', 'ḍaraba', 'il a frappé, cité'),
    w('fadlun', 'فَضْلٌ', 'faḍloun', 'une grâce'),
    w('al-ardi', 'ٱلْأَرْضِ', 'al-arḍi', 'la terre'),
    w('maridan', 'مَرِيضًا', 'marîḍan', 'malade'),
    w('ramadana', 'رَمَضَانَ', 'ramaḍâna', 'Ramadan'),
    w('baydun', 'بَيْضٌ', 'bayḍoun', 'des œufs'),
  ],
  taa: [
    w('taamun', 'طَعَامٌ', 'ṭa‘âmoun', 'une nourriture'),
    w('tayyiban', 'طَيِّبًا', 'ṭayyiban', 'bon, pur'),
    w('butuni', 'بُطُونِ', 'boutoûni', 'les ventres (de)'),
    w('tiflun', 'طِفْلٌ', 'ṭifloun', 'un enfant'),
    w('qittun', 'قِطٌّ', 'qiṭṭoun', 'un chat'),
  ],
  dhaa: [
    w('azimun', 'عَظِيمٌ', '‘aẓîmoun', 'immense'),
    w('zulman', 'ظُلْمًا', 'ẓoulman', 'une injustice'),
    w('hafizun', 'حَفِيظٌ', 'ḥafîẓoun', 'Gardien'),
    w('nazara', 'نَظَرَ', 'naẓara', 'il a regardé'),
    w('zillin', 'ظِلٍّ', 'ẓillin', 'une ombre'),
  ],

  /* ── Vers le Mushaf ─────────────────────────────────────────────────── */
  'petites-lettres': [
    w('ar-rahmani', 'ٱلرَّحْمَٰنِ', 'ar-raḥmâni', 'le Tout Miséricordieux'),
    w('maliki-dagger', 'مَٰلِكِ', 'mâliki', 'Souverain'),
    w('al-alamina', 'ٱلْعَٰلَمِينَ', 'al-‘âlamîna', 'les mondes'),
    w('hadha', 'هَٰذَا', 'hâdhâ', 'ceci'),
    w('al-kitabu', 'ٱلْكِتَٰبُ', 'al-kitâbou', 'le Livre'),
    w('lahu', 'لَهُۥ', 'lahoû', 'à Lui'),
    w('bihi', 'بِهِۦ', 'bihî', 'par lui'),
  ],
};

/** Article : mots classés lettres lunaires / lettres solaires. */
export const WORDS_QAMARI: WordEntry[] = [
  w('al-qamaru', 'ٱلْقَمَرُ', 'al-qamarou', 'la lune'),
  w('al-bayti', 'ٱلْبَيْتِ', 'al-bayti', 'la Maison'),
  w('al-yawma', 'ٱلْيَوْمَ', 'al-yawma', 'aujourd’hui'),
  w('al-maliku', 'ٱلْمَلِكُ', 'al-malikou', 'le Roi'),
  w('al-jabali', 'ٱلْجَبَلِ', 'al-jabali', 'la montagne'),
  w('al-khayru', 'ٱلْخَيْرُ', 'al-khayrou', 'le bien'),
  w('al-hamdu', 'ٱلْحَمْدُ', 'al-ḥamdou', 'la louange'),
  w('al-hutu', 'ٱلْحُوتُ', 'al-ḥoûtou', 'le poisson'),
];

export const WORDS_SHAMSI: WordEntry[] = [
  w('ash-shamsu', 'ٱلشَّمْسُ', 'ash-shamsou', 'le soleil'),
  w('an-nasi', 'ٱلنَّاسِ', 'an-nâsi', 'les hommes'),
  w('ar-rahimi', 'ٱلرَّحِيمِ', 'ar-raḥîmi', 'le Très Miséricordieux'),
  w('ad-dini', 'ٱلدِّينِ', 'ad-dîni', 'la Rétribution'),
  w('an-nuru', 'ٱلنُّورُ', 'an-noûrou', 'la lumière'),
  w('an-naru', 'ٱلنَّارُ', 'an-nârou', 'le feu'),
  w('an-nahari', 'ٱلنَّهَارِ', 'an-nahâri', 'le jour'),
  w('ar-ruhu', 'ٱلرُّوحُ', 'ar-roûḥou', 'l’Esprit'),
];

/**
 * Phrases de lecture suivie (chaque mot est cliquable). Elles réunissent
 * toutes les notions du parcours, dont les liaisons de l’alif de liaison.
 */
export const SENTENCES: { fr: string; words: WordEntry[] }[] = [
  {
    fr: 'L’enfant est allé à l’école.',
    words: [
      w('dhahaba', 'ذَهَبَ', 'dhahaba', 'il est allé'),
      w('al-waladu', 'ٱلْوَلَدُ', 'al-waladou', 'l’enfant'),
      w('ila', 'إِلَى', 'ilâ', 'vers'),
      w('al-madrasati', 'ٱلْمَدْرَسَةِ', 'al-madrasati', 'l’école'),
    ],
  },
  {
    fr: 'L’élève a lu le livre.',
    words: [
      w('qaraa', 'قَرَأَ', 'qara’a', 'il a lu'),
      w('at-tilmidhu', 'ٱلتِّلْمِيذُ', 'at-tilmîdhou', 'l’élève'),
      w('al-kitaba', 'ٱلْكِتَابَ', 'al-kitâba', 'le livre'),
    ],
  },
  {
    fr: 'Le soleil s’est levé sur la ville.',
    words: [
      w('talaati', 'طَلَعَتِ', 'ṭala‘ati', 'il s’est levé'),
      w('ash-shamsu', 'ٱلشَّمْسُ', 'ash-shamsou', 'le soleil'),
      w('ala', 'عَلَى', '‘alâ', 'sur'),
      w('al-madinati', 'ٱلْمَدِينَةِ', 'al-madînati', 'la ville'),
    ],
  },
  {
    fr: 'L’enfant a bu le lait froid.',
    words: [
      w('shariba', 'شَرِبَ', 'shariba', 'il a bu'),
      w('at-tiflu', 'ٱلطِّفْلُ', 'aṭ-ṭiflou', 'l’enfant'),
      w('al-haliba', 'ٱلْحَلِيبَ', 'al-ḥalîba', 'le lait'),
      w('al-barida', 'ٱلْبَارِدَ', 'al-bârida', 'froid'),
    ],
  },
  {
    fr: 'Dans le jardin, il y a une belle rose.',
    words: [
      w('fi', 'فِي', 'fî', 'dans'),
      w('al-hadiqati', 'ٱلْحَدِيقَةِ', 'al-ḥadîqati', 'le jardin'),
      w('wardatun', 'وَرْدَةٌ', 'wardatoun', 'une rose'),
      w('jamilatun', 'جَمِيلَةٌ', 'jamîlatoun', 'belle'),
    ],
  },
  {
    fr: 'Il s’est réveillé avant le lever du soleil, puis il a prié.',
    words: [
      w('istayqaza', 'ٱسْتَيْقَظَ', 'istayqaẓa', 'il s’est réveillé'),
      w('qabla', 'قَبْلَ', 'qabla', 'avant'),
      w('shuruqi', 'شُرُوقِ', 'shouroûqi', 'le lever'),
      w('ash-shamsi', 'ٱلشَّمْسِ', 'ash-shamsi', 'du soleil'),
      w('thumma', 'ثُمَّ', 'thoumma', 'puis'),
      w('salla', 'صَلَّى', 'ṣallâ', 'il a prié'),
    ],
  },
];
