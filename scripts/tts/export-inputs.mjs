#!/usr/bin/env node
/** Exporte la liste des sons à synthétiser vers scripts/tts/inputs.json. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const server = await createServer({ root, logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { ttsInputs } = await server.ssrLoadModule('/src/audio/ttsInputs.ts');
  const inputs = await ttsInputs();
  const out = path.join(root, 'scripts/tts/inputs.json');
  fs.writeFileSync(out, JSON.stringify(inputs));
  console.log(`✓ ${inputs.length} sons à synthétiser → ${path.relative(root, out)}`);
} finally {
  await server.close();
}
