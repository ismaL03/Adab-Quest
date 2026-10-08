/**
 * Contexte Web Audio partagé (sons intégrés + effets sonores).
 *
 * Les navigateurs mobiles (Safari iOS en particulier) n’autorisent le son
 * qu’après un geste de l’utilisateur : au premier toucher, on « déverrouille »
 * le contexte en jouant un échantillon silencieux. Ensuite, tous les sons
 * peuvent être joués à tout moment, même après un chargement asynchrone.
 */
let ctx: AudioContext | null = null;
let unlocked = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  return ctx;
}

/** À appeler pendant un geste utilisateur (clic, toucher, touche clavier). */
export function unlockAudio(): void {
  const ac = getAudioContext();
  if (!ac) return;
  if (ac.state !== 'running') void ac.resume().catch(() => {});
  if (unlocked) return;
  try {
    const buffer = ac.createBuffer(1, 1, 22050);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.connect(ac.destination);
    src.start(0);
    unlocked = true;
  } catch {
    /* le prochain geste réessaiera */
  }
}

if (typeof window !== 'undefined') {
  const events = ['pointerdown', 'touchend', 'keydown'] as const;
  const onGesture = () => {
    unlockAudio();
    if (unlocked && ctx?.state === 'running') events.forEach((e) => window.removeEventListener(e, onGesture, true));
  };
  events.forEach((e) => window.addEventListener(e, onGesture, { capture: true, passive: true }));
}
