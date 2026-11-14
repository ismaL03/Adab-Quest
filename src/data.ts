import raw from './words.json'
import surahAr from './surahs.json'

export type Word = { id: number; s: number; a: number; w: string; m: string }

// [sourate, verset, mot, sens] — l'identifiant d'un mot est sa position dans le livre.
export const WORDS: Word[] = (raw as [number, number, string, string][]).map(([s, a, w, m], id) => ({ id, s, a, w, m }))

const FR = [
  "Al-Isti'ādha", 'Al-Fātiḥa', 'Al-Baqara', "Āl ʿImrān", "An-Nisā'", "Al-Mā'ida", "Al-Anʿām", "Al-Aʿrāf", 'Al-Anfāl', 'At-Tawba', 'Yūnus',
  'Hūd', 'Yūsuf', "Ar-Raʿd", 'Ibrāhīm', 'Al-Ḥijr', 'An-Naḥl', "Al-Isrā'", 'Al-Kahf', 'Maryam', 'Ṭā-Hā',
  "Al-Anbiyā'", 'Al-Ḥajj', "Al-Mu'minūn", 'An-Nūr', 'Al-Furqān', "Ash-Shuʿarā'", 'An-Naml', 'Al-Qaṣaṣ', "Al-ʿAnkabūt", 'Ar-Rūm',
  'Luqmān', 'As-Sajda', 'Al-Aḥzāb', "Saba'", 'Fāṭir', 'Yā-Sīn', 'Aṣ-Ṣāffāt', 'Ṣād', 'Az-Zumar', 'Ghāfir',
  'Fuṣṣilat', 'Ash-Shūrā', 'Az-Zukhruf', 'Ad-Dukhān', 'Al-Jāthiya', 'Al-Aḥqāf', 'Muḥammad', 'Al-Fatḥ', 'Al-Ḥujurāt', 'Qāf',
  'Adh-Dhāriyāt', 'Aṭ-Ṭūr', 'An-Najm', 'Al-Qamar', 'Ar-Raḥmān', "Al-Wāqiʿa", 'Al-Ḥadīd', 'Al-Mujādala', 'Al-Ḥashr', 'Al-Mumtaḥana',
  'Aṣ-Ṣaff', "Al-Jumuʿa", 'Al-Munāfiqūn', 'At-Taghābun', 'Aṭ-Ṭalāq', 'At-Taḥrīm', 'Al-Mulk', 'Al-Qalam', 'Al-Ḥāqqa', "Al-Maʿārij",
  'Nūḥ', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddaththir', 'Al-Qiyāma', 'Al-Insān', 'Al-Mursalāt', "An-Naba'", "An-Nāziʿāt", "ʿAbasa",
  'At-Takwīr', 'Al-Infiṭār', 'Al-Muṭaffifīn', 'Al-Inshiqāq', 'Al-Burūj', 'Aṭ-Ṭāriq', "Al-Aʿlā", 'Al-Ghāshiya', 'Al-Fajr', 'Al-Balad',
  'Ash-Shams', 'Al-Layl', 'Aḍ-Ḍuḥā', 'Ash-Sharḥ', 'At-Tīn', "Al-ʿAlaq", 'Al-Qadr', 'Al-Bayyina', 'Az-Zalzala', "Al-ʿĀdiyāt",
  "Al-Qāriʿa", 'At-Takāthur', "Al-ʿAṣr", 'Al-Humaza', 'Al-Fīl', 'Quraysh', "Al-Māʿūn", 'Al-Kawthar', 'Al-Kāfirūn', 'An-Naṣr',
  'Al-Masad', 'Al-Ikhlāṣ', 'Al-Falaq', 'An-Nās',
]

export type Surah = { n: number; ar: string; fr: string; ids: number[] }

// Sourate 0 = الاستعاذة (les deux mots placés avant al-Fātiḥa dans le livre).
export const SURAHS: Surah[] = FR.map((fr, n) => ({
  n,
  fr,
  ar: n === 0 ? 'الاستعاذة' : (surahAr as string[])[n - 1],
  ids: [],
}))
for (const w of WORDS) SURAHS[w.s].ids.push(w.id)

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩'
export const arNum = (n: number) => String(n).replace(/\d/g, (d) => AR_DIGITS[+d])

// Recherche : on ignore les voyelles brèves et les variantes de alif / hamza.
export const fold = (t: string) =>
  t
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()

let folded: string[] | null = null
export function search(q: string, limit = 80): Word[] {
  const f = fold(q.trim())
  if (!f) return []
  folded ??= WORDS.map((w) => fold(w.w + ' | ' + w.m + ' | ' + SURAHS[w.s].fr))
  const out: Word[] = []
  for (let i = 0; i < folded.length && out.length < limit; i++) if (folded[i].includes(f)) out.push(WORDS[i])
  return out
}
