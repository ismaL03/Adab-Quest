#!/usr/bin/env node
/**
 * Recense les fichiers audio présents dans public/audio et écrit
 * public/audio/manifest.json. L’application ne tente de lire que les fichiers
 * listés : les autres basculent instantanément sur la source de secours
 * (audio Quran.com pour les mots du Coran, synthèse vocale sinon).
 *
 *   npm run audio:manifest          → régénère le manifeste
 *   npm run audio:list              → liste aussi les fichiers attendus manquants
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const audioDir = path.join(root, 'public/audio');
const EXT = new Set(['.mp3', '.ogg', '.oga', '.opus', '.m4a', '.aac', '.wav', '.webm']);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return EXT.has(path.extname(entry.name).toLowerCase()) ? [path.relative(audioDir, full).split(path.sep).join('/')] : [];
  });
}

const files = walk(audioDir).sort();
fs.mkdirSync(audioDir, { recursive: true });
fs.writeFileSync(path.join(audioDir, 'manifest.json'), JSON.stringify({ count: files.length, files }, null, 2) + '\n');
console.log(`✓ manifeste audio : ${files.length} fichier(s) détecté(s) dans public/audio`);

if (process.argv.includes('--list')) {
  // Charge le parcours via Vite (TypeScript + alias) pour connaître les sons attendus.
  const { createServer } = await import('vite');
  const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  try {
    const { expectedAudio } = await server.ssrLoadModule('/src/audio/expected.ts');
    const expected = expectedAudio();
    const present = new Set(files.map((f) => f.replace(/\.[a-z0-9]+$/i, '')));
    const missing = expected.filter((e) => !present.has(e.src.replace(/\.[a-z0-9]+$/i, '')));
    const out = path.join(root, 'docs/audio-attendus.txt');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(
      out,
      [
        '# Fichiers audio attendus par le parcours (chemin relatif à public/audio — texte à enregistrer)',
        '# Les mots du Coran (quran/wbw/SSS_AAA_MMM.mp3) sont servis par Quran.com par défaut.',
        '',
        ...expected.map((e) => `${present.has(e.src.replace(/\.[a-z0-9]+$/i, '')) ? '✓' : '·'} ${e.src}\t${e.text}`),
      ].join('\n') + '\n',
    );
    console.log(`  ${expected.length} sons utilisés par le parcours, ${missing.length} manquant(s).`);
    console.log(`  Liste complète écrite dans ${path.relative(root, out)}`);
  } finally {
    await server.close();
  }
}
