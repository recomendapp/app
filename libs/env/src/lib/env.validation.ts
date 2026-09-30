import { z } from 'zod';

/* --------------------------------- MODULES -------------------------------- */
export const redisSchema = z.object({
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
});

export const typesenseSchema = z.object({
  TYPESENSE_HOST: z.string(),
  TYPESENSE_PORT: z.coerce.number().default(8108),
  TYPESENSE_PROTOCOL: z.enum(['http', 'https']).default('http'),
  TYPESENSE_API_KEY: z.string(),
});

export const s3Schema = z.object({
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().default('eu-west-1'),
  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_BUCKET: z.string().default('medias'),
  S3_PUBLIC_ENDPOINT: z.url().optional(),
  // Private bucket for import/export files (never made public) — see libs/db import.ts / apps/api imports module
  S3_IMPORTS_BUCKET: z.string().default('imports'),
});

export const extensionSchema = redisSchema;

export const commonSchema = extensionSchema.extend({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  WEB_APP_URL: z.url().default('http://localhost:3000'),
});

// Static assets served from RustFS/S3 (see libs/assets)
export const assetsSchema = z.object({
  ASSETS_BASE_URL: z.url(),
});
/* -------------------------------------------------------------------------- */

export const apiSchema = commonSchema
  .extend(s3Schema.shape)
  .extend(typesenseSchema.shape)
  .extend(assetsSchema.shape)
  .extend({
    PORT: z.coerce.number().default(9000),
    HOST: z.string().default('0.0.0.0'),
    API_URL: z.url().default('https://api.recomend.app'),
    DATABASE_URL: z.string(),
    MOBILE_APP_SCHEME: z.string().default('recomend://'),

    // Auth
    AUTH_COOKIE_DOMAIN: z.string().default('recomend.app'),
    AUTH_SECRET: z.string(),

    // OAuth
    AUTH_GOOGLE_CLIENT_ID: z.string(),
    AUTH_GOOGLE_IOS_CLIENT_ID: z.string(),
    AUTH_GOOGLE_ANDROID_CLIENT_ID: z.string(),
    AUTH_GOOGLE_CLIENT_SECRET: z.string(),
    AUTH_GITHUB_CLIENT_ID: z.string(),
    AUTH_GITHUB_CLIENT_SECRET: z.string(),
    AUTH_FACEBOOK_CLIENT_ID: z.string(),
    AUTH_FACEBOOK_CLIENT_SECRET: z.string(),
    AUTH_APPLE_CLIENT_ID: z.string(),
    AUTH_APPLE_TEAM_ID: z.string(),
    AUTH_APPLE_KEY_ID: z.string(),
    AUTH_APPLE_PRIVATE_KEY: z.string(),
    AUTH_APPLE_BUNDLE_ID: z.string(),

    // RevenueCat
    REVENUECAT_API_KEY: z.string(),
    REVENUECAT_WEBHOOK_SECRET: z.string(),

    // Imports/exports — Prefect flow trigger (see db-sync/import_transfer) + internal webhook auth
    PREFECT_API_URL: z.url(),
    PREFECT_API_AUTH_STRING: z.string(),
    API_INTERNAL_IMPORTS_SECRET: z.string(),

    // Mobile CI (see .github/workflows/mobile-router.yml) writing the version_policy table
    API_INTERNAL_VERSION_POLICY_SECRET: z.string(),

    // App Store Connect — JWT auth to resolve the appStoreVersions id an incoming
    // webhook event refers to into an actual version/platform (see apps/api/src/app/webhooks)
    APP_STORE_CONNECT_KEY_ID: z.string(),
    APP_STORE_CONNECT_ISSUER_ID: z.string(),
    APP_STORE_CONNECT_PRIVATE_KEY: z.string(),
    APP_STORE_CONNECT_APP_ID: z.string(),
    APP_STORE_CONNECT_WEBHOOK_SECRET: z.string(),
  });

export const notifySchema = commonSchema
  .extend(assetsSchema.shape)
  .extend(s3Schema.pick({ S3_ENDPOINT: true, S3_PUBLIC_ENDPOINT: true, S3_BUCKET: true }).shape)
  .extend({
    PORT: z.coerce.number().default(9001),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string(),

    RESEND_API_KEY: z.string().startsWith('re_'),
    RESEND_FROM_EMAIL: z.string().default('Recomend <hello@recomend.app>'),

    FIREBASE_PROJECT_ID: z.string(),
    FIREBASE_CLIENT_EMAIL: z.string(),
    FIREBASE_PRIVATE_KEY_B64: z.string().transform((str) => {
      return Buffer.from(str, 'base64').toString('utf-8');
    }),

    APNS_KEY_B64: z.string().transform((str) => {
      return Buffer.from(str, 'base64').toString('utf-8');
    }),
    APNS_KEY_ID: z.string(),
    APNS_TEAM_ID: z.string(),
    APNS_BUNDLE_ID: z.string(),

    TMDB_IMAGE_BASE_URL: z.url().default('https://image.tmdb.org/t/p'),
  });

export const workerSchema = commonSchema.extend(typesenseSchema.shape).extend({
  PORT: z.coerce.number().default(9002),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string(),
});

export function validateEnv<T extends z.ZodType>(schema: T): z.infer<T> {
  if (process.env['SKIP_ENV_VALIDATION'] === 'true') {
    return mockParse(schema);
  }

  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

/** A value that would satisfy `issue` were it substituted in, or `null` if we don't know one. */
function mockValueFor(issue: z.core.$ZodIssue): string | null {
  if (issue.code === 'invalid_type') {
    if (issue.expected === 'number') return '0';
    if (issue.expected === 'string') return 'mock';
    return null;
  }
  if (issue.code === 'invalid_format') {
    if (issue.format === 'url') return 'https://example.com';
    if (issue.format === 'email') return 'mock@example.com';
    // Zod's `$ZodIssue` union doesn't carry `prefix`/`suffix` on the common
    // invalid_format shape even though these two formats always set them.
    if (issue.format === 'starts_with') {
      return `${(issue as z.core.$ZodIssueStringStartsWith).prefix}mock`;
    }
    if (issue.format === 'ends_with') {
      return `mock${(issue as z.core.$ZodIssueStringEndsWith).suffix}`;
    }
    return 'mock';
  }
  return null;
}

/**
 * Used only by build-time tooling (OpenAPI generation, and the typed API client
 * codegen that depends on it) that never actually reads these values -- it just
 * needs the Nest module graph to construct without crashing, since some providers
 * read env straight from their constructor (e.g. PrefectService). Real values in
 * `process.env` always win; this only fills in whatever's missing or malformed,
 * one Zod issue at a time, so a schema change never needs a matching update here.
 */
function mockParse<T extends z.ZodType>(schema: T): z.infer<T> {
  const candidate: Record<string, unknown> = { ...process.env };

  // Each pass can only see issues Zod reports for the *current* candidate (e.g. a
  // missing field reports as invalid_type until it's filled with some string, only
  // then do that string's own format checks -- url, startsWith, ... -- surface) --
  // a handful of passes is always enough for a flat env schema.
  for (let attempt = 0; attempt < 10; attempt++) {
    const parsed = schema.safeParse(candidate);
    if (parsed.success) return parsed.data;

    let fixedAny = false;
    for (const issue of parsed.error.issues) {
      if (issue.path.length !== 1) continue;
      const mock = mockValueFor(issue);
      if (mock === null) continue;
      candidate[String(issue.path[0])] = mock;
      fixedAny = true;
    }

    if (!fixedAny) {
      console.error('❌ Could not mock environment variables:', parsed.error.format());
      process.exit(1);
    }
  }

  console.error('❌ Could not mock environment variables after 10 attempts');
  process.exit(1);
}
