#!/usr/bin/env node
/**
 * Intègre un export du Studio d’enregistrement (fichier .zip) au site :
 * chaque son est converti en MP3 (silences coupés, volume harmonisé) dans
 * public/audio/<chemin>.mp3, puis le manifeste audio est régénéré.
 *
 *   npm run audio:import -- iqra-enregistrements-2026-10-09.zip
 *
 * Nécessite ffmpeg.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const zipPath = process.argv[2];
if (!zipPath) {
  console.error('Usage : npm run audio:import -- <export-du-studio.zip>');
  process.exit(1);
}

const FILTER =
  'silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.03,areverse,' +
  'silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.10,areverse,' +
  'loudnorm=I=-17:TP=-1.5:LRA=11,apad=pad_dur=0.08';

const files = unzipSync(new Uint8Array(fs.readFileSync(zipPath)));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iqra-import-'));
let count = 0;
for (const [name, data] of Object.entries(files)) {
  const m = name.match(/^(?:.*?\/)?((?:letters|syllables|words)\/[a-z0-9_.-]+)\.(wav|webm|m4a|mp3|ogg|opus|aac)$/i);
  if (!m) continue;
  const input = path.join(tmp, `in-${count}.${m[2]}`);
  fs.writeFileSync(input, data);
  const output = path.join(root, 'public/audio', `${m[1]}.mp3`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  // Un enregistrement importé remplace toute version précédente du même son.
  for (const ext of ['wav', 'webm', 'm4a', 'ogg', 'opus', 'aac']) fs.rmSync(path.join(root, 'public/audio', `${m[1]}.${ext}`), { force: true });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', input, '-af', FILTER, '-ac', '1', '-ar', '44100', '-b:a', '80k', output]);
  count++;
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✓ ${count} enregistrement(s) importé(s) dans public/audio`);
execFileSync('node', [path.join(root, 'scripts/audio-manifest.mjs'), '--list'], { stdio: 'inherit' });
