// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tanstackRouter(), wasm(), topLevelAwait()],
    server: {
      port: parseInt(env.VITE_PORT || '5173', 10),
      host: 'localhost',
      fs: {
        allow: ['..'],
      },
    },
    optimizeDeps: {
      exclude: ['argon2-browser'],
      esbuildOptions: { target: 'esnext' },
    },
    define: {
      global: 'globalThis',
    },
    worker: {
      format: 'es',
    },
  };
});
