import { useSettings } from '@/store/settings';
import { getAudioContext } from './context';

/**
 * Effets sonores de l’interface, synthétisés en temps réel avec Web Audio :
 * aucun fichier requis, latence nulle, timbre doux (sinusoïdes + enveloppes).
 */
function context(): AudioContext | null {
  const ac = getAudioContext();
  if (ac && ac.state === 'suspended') void ac.resume().catch(() => {});
  return ac;
}

interface ToneOptions {
  freq: number;
  at?: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  glideTo?: number;
}

function tone({ freq, at = 0, duration = 0.18, type = 'sine', gain = 0.12, glideTo }: ToneOptions) {
  const ac = context();
  if (!ac) return;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

const enabled = () => useSettings.getState().sfx;

export const sfx = {
  tap() {
    if (!enabled()) return;
    tone({ freq: 880, duration: 0.05, gain: 0.03, type: 'triangle' });
  },
  select() {
    if (!enabled()) return;
    tone({ freq: 660, duration: 0.08, gain: 0.05, type: 'triangle' });
  },
  correct() {
    if (!enabled()) return;
    tone({ freq: 784, duration: 0.16, gain: 0.1 });
    tone({ freq: 1175, at: 0.09, duration: 0.28, gain: 0.09 });
    tone({ freq: 2350, at: 0.09, duration: 0.2, gain: 0.015 });
  },
  wrong() {
    if (!enabled()) return;
    tone({ freq: 220, duration: 0.22, gain: 0.08, type: 'triangle', glideTo: 160 });
  },
  match() {
    if (!enabled()) return;
    tone({ freq: 988, duration: 0.12, gain: 0.07 });
    tone({ freq: 1319, at: 0.06, duration: 0.18, gain: 0.06 });
  },
  complete() {
    if (!enabled()) return;
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, at: i * 0.11, duration: 0.42, gain: 0.08 }));
    tone({ freq: 2093, at: 0.44, duration: 0.6, gain: 0.025 });
  },
  unlock() {
    if (!enabled()) return;
    [1175, 1568, 2093].forEach((f, i) => tone({ freq: f, at: i * 0.07, duration: 0.3, gain: 0.04 }));
  },
};
