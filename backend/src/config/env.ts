import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // MongoDB
  MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
  
  // Lemon Squeezy
  LEMONSQUEEZY_API_KEY: z.string().min(1, 'Lemon Squeezy API key is required'),
  LEMONSQUEEZY_STORE_ID: z.string().min(1, 'Lemon Squeezy store ID is required'),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().min(1, 'Lemon Squeezy webhook secret is required'),
  LEMONSQUEEZY_PRO_VARIANT_ID: z.string().min(1, 'Pro plan variant ID is required'),
  LEMONSQUEEZY_AGENCY_VARIANT_ID: z.string().optional(),
  
  // Sentry
  SENTRY_DSN: z.string().optional(),
  
  // PostHog
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default('https://app.posthog.com'),
  
  // Supabase
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  
  // JWT
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
