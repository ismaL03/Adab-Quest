import { useEffect } from 'react';
import { useSettings } from '@/store/settings';

/** Applique le thème (clair / sombre / système) sur <html> et la barre du navigateur. */
export function useThemeSync() {
  const theme = useSettings((s) => s.theme);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;
    const apply = () => {
      // En mode « système », un thème imposé par la page hôte (data-theme) a priorité.
      const host = root.getAttribute('data-theme');
      const systemDark = host === 'dark' || (host !== 'light' && media.matches);
      const dark = theme === 'dark' || (theme === 'system' && systemDark);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#090D0C' : '#F6F3EC'));
    };
    apply();
    media.addEventListener('change', apply);
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      media.removeEventListener('change', apply);
      observer.disconnect();
    };
  }, [theme]);
}
