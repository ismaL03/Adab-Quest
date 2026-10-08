import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { audio } from './audio/engine';
import './styles/index.css';

// Charge dès le démarrage l’inventaire des sons (enregistrements + sons intégrés).
void audio.preload([]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
