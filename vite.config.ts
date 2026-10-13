import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isSupabase = process.env.VITE_DATA_BACKEND === 'supabase';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
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
