import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Load .env from project root or server dir
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_PATH: z.string().default('./data/ritsu.db'),
  SESSION_SECRET: z.string().min(16).default('ritsu-default-session-secret-key-32chars!'),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://127.0.0.1:5173')
    .transform((val) => val.split(',').map((s) => s.trim())),
  BASE_URL: z.string().default('http://localhost:5173'),
  DEMO_MODE: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true' || val === '1'),
  OWNER_PASSWORD_HASH: z.string().optional().default(''),
  RESTAURANT_NAME: z.string().default('Ritsu Food Corner'),
  RESTAURANT_TAGLINE: z.string().default('Indo-Chinese ka asli maza – Ristsu ke saath!'),
  RESTAURANT_PHONE: z.string().default('+91 98765 43210'),
  RESTAURANT_ADDRESS: z.string().default('Main Road, Food Street, India'),
  UPI_VPA: z.string().default('ritsu@upi'),
  GSTIN: z.string().default('36ABCDE1234F1Z5'),
  TAX_RATE_BPS: z.coerce.number().default(500), // 500 = 5%
  PRICES_INCLUDE_TAX: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid configuration environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const config = parsed.data;
export type Config = typeof config;
