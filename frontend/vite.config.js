import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // host: true binds to 0.0.0.0 so other devices on the same Wi-Fi/LAN
    // (e.g. your phone) can open the app at http://<your-PC-IP>:5173
    host: true,
    port: 5173,
    // Proxy API calls to the Express backend. Because the proxy runs on this
    // dev server, the phone only ever talks to Vite — which forwards /api to
    // the backend locally. No extra phone config needed.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
