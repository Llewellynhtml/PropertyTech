import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  loadEnv(mode, '.', '');

  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 3000,
      hmr:
        process.env.DISABLE_HMR === 'true'
          ? false
          : {
              clientPort: process.env.HMR_PORT ? Number(process.env.HMR_PORT) : undefined,
              protocol: process.env.HMR_PROTOCOL || undefined,
            },
    },
  };
});
