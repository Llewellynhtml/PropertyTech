import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    base: "/",
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 3000,
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : {
            clientPort: process.env.HMR_PORT
              ? Number(process.env.HMR_PORT)
              : undefined,
            protocol: (process.env.HMR_PROTOCOL as 'ws' | 'wss') || undefined,
          },
    },
  };
});
