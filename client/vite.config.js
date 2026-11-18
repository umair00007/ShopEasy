import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Dev proxy: the browser calls /api/... on the Vite server (port 5173), and Vite
    // forwards it to Express (port 5001). In production, Nginx does the same job.
    // WHY: the frontend always uses the relative path "/api" in dev and prod alike,
    // and there are no CORS problems because the browser only ever sees one origin.
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
});
