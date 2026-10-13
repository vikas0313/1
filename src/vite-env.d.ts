/// <reference types="vite/client" />

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_DATA_BACKEND?: string;
  readonly VITE_DEMO_OWNER_PASSWORD?: string;
  readonly VITE_BASE_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
