import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import '@fontsource/amiri/arabic-400.css'
import '@fontsource/amiri/arabic-700.css'
import './styles.css'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)

// Version web : fonctionne hors ligne une fois ouverte (utile sur iPhone, « Sur l'écran d'accueil »).
if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('./sw.js').catch(() => {})
}
