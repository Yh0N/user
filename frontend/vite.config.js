import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/usuarios': 'http://api:3000',  // Proxiar el backend de Node.js
    }
  }
});
