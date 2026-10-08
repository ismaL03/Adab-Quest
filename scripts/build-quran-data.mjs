#!/usr/bin/env node
/**
 * Génère les données coraniques mot-à-mot (avec annotations Tajweed) utilisées
 * par la Vue Mushaf : src/data/quran/surahs/NNN.json
 *
 * Source : le paquet MIT « react-native-quran-tajweed@0.1.3 » (texte Uthmani
 * Hafs de Quran.com, champ `text_uthmani_tajweed`, pré-segmenté par règle).
 *
 *   npm pack react-native-quran-tajweed@0.1.3
 *   tar xzf react-native-quran-tajweed-0.1.3.tgz
 *   node scripts/build-quran-data.mjs package/src/data
 *
 * Format de sortie (compact, chargé à la demande par Vite) :
 *   { "n": 1, "v": [ verse, ... ] }
 *   verse = [ word, ... ]                       (position du mot = index + 1)
 *   word  = [ segment, ... ]
 *   segment = "texte"                           (aucune règle)
 *           | ["texte", [codeRègle, ...]]       (codes → LEGEND ci-dessous)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.resolve(process.argv[2] ?? 'package/src/data');
const outDir = path.join(root, 'src/data/quran/surahs');

const index = JSON.parse(fs.readFileSync(path.join(srcDir, 'index.json'), 'utf8'));
const EXPECTED_LEGEND = [
  'ham_wasl', 'laam_shamsiyah', 'slnt', 'madda_normal', 'madda_permissible',
  'madda_obligatory', 'madda_necessary', 'qalaqah', 'ghunnah', 'ikhafa',
  'ikhafa_shafawi', 'idgham_ghunnah', 'idgham_wo_ghunnah', 'idgham_shafawi',
  'iqlab', 'idgham_mutajanisayn', 'idgham_mutaqaribayn', 'tafkhim', 'tarqiq',
];
if (JSON.stringify(index.legend) !== JSON.stringify(EXPECTED_LEGEND)) {
  throw new Error('La légende des règles a changé : mettez à jour src/features/mushaf/tajweed.ts');
}

// ۞ (début de hizb) se colle au mot suivant, ۩ (sajda) au mot précédent :
// ainsi la position de chaque mot correspond à celle de Quran.com (audio mot-à-mot).
const PREFIX_TOKENS = new Set(['۞']);
const SUFFIX_TOKENS = new Set(['۩']);

/** Découpe une liste de segments [texte, règles] en mots. */
function splitWords(segments) {
  const words = [];
  let current = [];
  const push = (text, rules) => {
    if (!text) return;
    const last = current[current.length - 1];
    if (last && sameRules(last[1], rules)) last[0] += text;
    else current.push([text, rules]);
  };
  const flush = () => {
    if (current.length) words.push(current);
    current = [];
  };
  for (const [rawText, rules] of segments) {
    const text = rawText.replace(/>/g, ''); // artefact présent dans la source (32:3)
    let buffer = '';
    for (const ch of text) {
      if (ch === ' ') {
        push(buffer, rules);
        buffer = '';
        flush();
      } else buffer += ch;
    }
    push(buffer, rules);
  }
  flush();

  // Fusion des signes isolés (۞ / ۩) avec leur mot voisin.
  const merged = [];
  let pendingPrefix = null;
  for (const word of words) {
    const text = word.map((s) => s[0]).join('');
    if (PREFIX_TOKENS.has(text)) {
      pendingPrefix = text + ' ';
      continue;
    }
    if (SUFFIX_TOKENS.has(text) && merged.length) {
      merged[merged.length - 1].push([' ' + text, []]);
      continue;
    }
    if (pendingPrefix) {
      word.unshift([pendingPrefix, []]);
      pendingPrefix = null;
    }
    merged.push(word);
  }
  return merged;
}

function sameRules(a, b) {
  return a.length === b.length && a.every((r, i) => r === b[i]);
}

const compactSegment = ([text, rules]) => (rules.length ? [text, rules] : text);

fs.mkdirSync(outDir, { recursive: true });
let totalWords = 0;
for (let n = 1; n <= 114; n++) {
  const file = path.join(srcDir, `surah_${String(n).padStart(3, '0')}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const verses = data.ayahs
    .sort((a, b) => a.ayah - b.ayah)
    .map((a) => splitWords(a.s).map((w) => w.map(compactSegment)));
  if (verses.length !== index.surahs[String(n)].ayahs) {
    throw new Error(`Sourate ${n} : nombre de versets inattendu`);
  }
  totalWords += verses.reduce((acc, v) => acc + v.length, 0);
  fs.writeFileSync(
    path.join(outDir, `${String(n).padStart(3, '0')}.json`),
    JSON.stringify({ n, v: verses }),
  );
}
console.log(`✓ 114 sourates générées (${totalWords} mots) → ${path.relative(root, outDir)}`);
