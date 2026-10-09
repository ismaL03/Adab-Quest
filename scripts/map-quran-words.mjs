#!/usr/bin/env node
/**
 * Associe chaque mot de vocabulaire du parcours à une occurrence identique dans
 * le Coran (même orthographe, mêmes voyelles). Ces mots sont alors lus par la
 * récitation mot-à-mot de Quran.com, une vraie voix humaine.
 *   → src/data/curriculum/quranWordAudio.json  { slug: "sourate:verset:mot" }
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  // Exports de words.ts : listes de mots, tables { leçon: mots } ou { lettre: mot-clé }, phrases.
  const flatten = (v) =>
    Array.isArray(v) ? v.flatMap(flatten) : v && typeof v === 'object' ? (v.slug ? [v] : Object.values(v).flatMap(flatten)) : [];
  const words = [...new Map(flatten(Object.values(await server.ssrLoadModule('/src/data/curriculum/words.ts'))).map((w) => [w.slug, w])).values()];
  const { loadSurah } = await server.ssrLoadModule('/src/data/quran/loader.ts');
  const { normalizeQuranText } = await server.ssrLoadModule('/src/data/quran/normalize.ts');
  const index = new Map();
  for (let s = 1; s <= 114; s++) {
    for (const v of await loadSurah(s)) {
      for (const w of v.words) {
        const k = normalizeQuranText(w.text);
        if (!index.has(k)) index.set(k, w.key);
      }
    }
  }
  const map = {};
  const missing = [];
  for (const w of words) {
    const key = index.get(normalizeQuranText(w.ar));
    if (key) map[w.slug] = key;
    else missing.push(w.ar);
  }
  const out = path.join(root, 'src/data/curriculum/quranWordAudio.json');
  fs.writeFileSync(out, JSON.stringify(Object.fromEntries(Object.entries(map).sort()), null, 2) + '\n');
  console.log(`✓ ${Object.keys(map).length}/${words.length} mots relus par la récitation du Coran → ${path.relative(root, out)}`);
  if (missing.length) console.log(`  sans occurrence identique : ${[...new Set(missing)].join(' ')}`);
} finally {
  await server.close();
}
