import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendPort = Number(env.BACKEND_PORT || 8000);
  const frontendPort = Number(env.FRONTEND_PORT || 5173);

  return {
    root: 'frontend',
    base: './',
    plugins: [react()],
    server: {
      port: frontendPort,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      port: frontendPort,
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
  };
});
