import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    base: './', // CRITICAL: Ensures assets load correctly in Capacitor (file:// protocol)
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env': {}, // Polyfill to prevent "process is not defined" crash
    }
  };
});