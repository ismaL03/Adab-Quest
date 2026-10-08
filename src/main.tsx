import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { audio } from './audio/engine';
import './styles/index.css';

// Charge la liste des fichiers audio disponibles dès le démarrage.
void audio.loadManifest();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
