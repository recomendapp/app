import { z } from 'zod';

/* --------------------------------- MODULES -------------------------------- */
export const commonSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  WEB_APP_URL: z.url().default('http://localhost:3000'),
});

export const redisSchema = z.object({
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
});
/* -------------------------------------------------------------------------- */

export const apiSchema = commonSchema.extend(redisSchema.shape).extend({
  PORT: z.coerce.number().default(9000),
  HOST: z.string().default('0.0.0.0'),
  API_URL: z.url().default('http://localhost:9000'),
  DATABASE_URL: z.string(),

  // Auth
  AUTH_SECRET: z.string(),

  // OAuth
  AUTH_GITHUB_CLIENT_ID: z.string(),
  AUTH_GITHUB_CLIENT_SECRET: z.string(),

  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),

  TYPESENSE_HOST: z.string(),
  TYPESENSE_PORT: z.coerce.number().default(8108),
  TYPESENSE_PROTOCOL: z.enum(['http', 'https']).default('http'),
  TYPESENSE_API_KEY: z.string(),
});

export const mailerSchema = commonSchema.extend(redisSchema.shape).extend({
  PORT: z.coerce.number().default(9001),
  HOST: z.string().default('0.0.0.0'),

  RESEND_API_KEY: z.string().startsWith('re_'),
  RESEND_FROM_EMAIL: z.string().default('Recomend <hello@recomend.app>'),
});

export function validateEnv<T extends z.ZodType>(schema: T): z.infer<T> {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}
