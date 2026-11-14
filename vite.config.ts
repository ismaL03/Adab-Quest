import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Chemins relatifs : la même build sert l'app Android (Capacitor) et le site (GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
})
