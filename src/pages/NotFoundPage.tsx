import { Link } from 'react-router';
import { Arabic } from '@/components/ui/primitives';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Arabic className="text-7xl text-primary">؟</Arabic>
        <h1 className="mt-4 font-display text-3xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-muted">Cette page n’existe pas ou a été déplacée.</p>
        <Link to="/" className="mt-6 inline-flex rounded-2xl bg-primary px-5 py-3 font-semibold text-on-primary">
          Retour au parcours
        </Link>
      </div>
    </div>
  );
}
