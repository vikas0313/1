import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { localSyncPlugin } from './plugins/localSyncPlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isSupabase = process.env.VITE_DATA_BACKEND === 'supabase';

  return {
    plugins: [
      react(),
      tailwindcss(),
      localSyncPlugin(),
    ],
    server: {
      host: true, // Listen on all addresses (0.0.0.0) so phone on local Wi-Fi can connect
    },
    define: {
      ...(isSupabase ? { 'admin123': '""' } : {}),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: [],
    },
  };
});
