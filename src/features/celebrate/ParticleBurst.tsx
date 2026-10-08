import { motion } from 'motion/react';
import { useMemo } from 'react';

/**
 * Gerbe de particules radiale (bonne réponse, nœud débloqué).
 * Purement décorative : se place en absolu au centre de son parent.
 */
export function ParticleBurst({ count = 14, color = 'var(--gold)', radius = 70 }: { count?: number; color?: string; radius?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = radius * (0.6 + Math.random() * 0.6);
        return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 4 + Math.random() * 5, delay: Math.random() * 0.08 };
      }),
    [count, radius],
  );
  return (
    <span className="pointer-events-none absolute top-1/2 left-1/2 z-20" aria-hidden>
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: i % 3 === 0 ? 'var(--primary)' : color, marginLeft: -p.size / 2, marginTop: -p.size / 2 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.75, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </span>
  );
}
