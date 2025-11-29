import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/'  // Cseréld a repo nevedre, pl. '/repo-name/' GitHub Pages-hez
})