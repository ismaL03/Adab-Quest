import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { expectedAudio } from '@/audio/expected';
import { sounds } from '@/audio/sounds';
import { BUNDLED_SURAHS } from '@/audio/ttsInputs';
import { loadSurah } from '@/data/quran/loader';

const packsDir = path.resolve(process.cwd(), 'public/audio/packs');
const index = JSON.parse(fs.readFileSync(path.join(packsDir, 'index.json'), 'utf8')) as {
  packs: { id: string; file: string; duration: number }[];
  clips: Record<string, [number, number, number]>;
};
const stem = (p: string) => p.replace(/\.[a-z0-9]+$/i, '');

describe('sons intégrés (paquets audio)', () => {
  it('fournit un son pour chaque lettre, syllabe et mot du parcours', () => {
    const missing = expectedAudio().filter((e) => !index.clips[stem(e.src)]);
    expect(missing.map((m) => m.src)).toEqual([]);
  });

  it('fournit un son pour chaque mot d’Al-Fâtiha et de Juz ‘Amma', async () => {
    const missing: string[] = [];
    for (const n of BUNDLED_SURAHS) {
      for (const v of await loadSurah(n)) {
        for (const w of v.words) {
          const src = sounds.quranWord(w.surah, w.ayah, w.position, w.text).src;
          if (!index.clips[stem(src)]) missing.push(src);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('référence des paquets existants et des extraits cohérents', () => {
    for (const p of index.packs) expect(fs.existsSync(path.join(packsDir, path.basename(p.file))), p.file).toBe(true);
    for (const [key, [pack, start, dur]] of Object.entries(index.clips)) {
      const p = index.packs[pack];
      expect(p, key).toBeDefined();
      expect(dur, key).toBeGreaterThan(0.1);
      expect(start + dur, key).toBeLessThanOrEqual(p.duration + 0.01);
    }
  });
});
