import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  LEMONSQUEEZY_API_KEY: z.string().min(1, 'Lemon Squeezy API key is required'),
  LEMONSQUEEZY_STORE_ID: z.string().min(1, 'Lemon Squeezy store ID is required'),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1, 'Lemon Squeezy webhook secret is required'),
  LEMONSQUEEZY_PRO_VARIANT_ID: z.string().min(1, 'Pro plan variant ID is required'),
  LEMONSQUEEZY_AGENCY_VARIANT_ID: z.string().optional(),
  
  GOOGLE_CLIENT_ID: z.string().optional(),
  
  SENTRY_DSN: z.string().optional(),
  
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default('https://app.posthog.com'),
  
  CORS_ORIGIN: z.string().default('*'),
  
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
});

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      console.error('Environment validation failed:');
      missingVars.forEach((msg) => console.error(`  - ${msg}`));
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
