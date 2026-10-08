import confetti from 'canvas-confetti';

const PALETTE = ['#0e7c66', '#33c29b', '#d9ae52', '#f1cf82', '#ffffff'];

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Grande célébration de fin de leçon : deux canons latéraux + pluie dorée. */
export function celebrateLesson() {
  if (reducedMotion()) return;
  const defaults = { colors: PALETTE, ticks: 260, gravity: 0.9, scalar: 1, disableForReducedMotion: true };
  confetti({ ...defaults, particleCount: 70, spread: 70, angle: 60, origin: { x: 0, y: 0.75 }, startVelocity: 55 });
  confetti({ ...defaults, particleCount: 70, spread: 70, angle: 120, origin: { x: 1, y: 0.75 }, startVelocity: 55 });
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 90,
      spread: 140,
      origin: { x: 0.5, y: 0.2 },
      startVelocity: 25,
      shapes: ['star'],
      colors: ['#d9ae52', '#f1cf82', '#ffffff'],
      scalar: 1.1,
    });
  }, 320);
}

/** Petite gerbe d’étincelles à une position (bonne réponse, badge…). */
export function sparkleAt(x: number, y: number) {
  if (reducedMotion() || typeof window === 'undefined') return;
  confetti({
    particleCount: 26,
    spread: 360,
    startVelocity: 18,
    ticks: 70,
    gravity: 0.6,
    scalar: 0.7,
    shapes: ['star', 'circle'],
    colors: ['#d9ae52', '#33c29b', '#f1cf82'],
    origin: { x: x / window.innerWidth, y: y / window.innerHeight },
    disableForReducedMotion: true,
  });
}
