// DB
export * from './lib/client';
// Auth
export * from './lib/auth-fields';
// Type-only on purpose: evaluating lib/auth builds a full better-auth instance, and
// its mcp() plugin seeds `auth.oauth_resource` in the database at init. That config
// exists for the better-auth CLI (scripts/generate-auth.ts), not for runtime code.
export type { auth } from './lib/auth';
