import { betterAuth, type BetterAuthPlugin } from 'better-auth';
import { jwt, magicLink, openAPI, username } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { mcp } from '@better-auth/mcp';
import { cimd } from '@better-auth/cimd';
import { fetchClientMetadataResource } from '@better-auth/cimd/node';
import { db } from './client';
import { additionalFields } from './auth-fields';
import type {} from 'zod';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  basePath: '/auth',
  plugins: [
    username(),
    openAPI(),
    magicLink({
      disableSignUp: true,
      sendMagicLink: async () => {
        /* No-op for CLI */
      },
    }),
    // Explicit issuer: oauth-provider's init() reads `jwt.issuer ?? ctx.baseURL`
    // for its own JWT issuer sanity check, but runs before better-auth's core
    // context has finished resolving `ctx.baseURL` — the fallback throws
    // `TypeError: Invalid URL` otherwise (verified locally). This CLI-only
    // config never sets `baseURL` either, so this is required here too.
    jwt({ jwt: { issuer: 'https://api.recomend.app' } }),
    // `@better-auth/mcp`'s init() return type doesn't structurally match this
    // `better-auth` version's `BetterAuthPlugin.init()` signature (deep-partial
    // session/context wrapping differs) even though both are pinned to 1.7.5 —
    // an upstream type-declaration gap between these very recently released
    // packages, not a runtime issue (verified: `auth generate` constructs and
    // runs this exact plugin without error).
    mcp({
      // Absolute, pointing at the web app: better-auth resolves these paths
      // against its own baseURL (the API's origin), not the frontend's — a
      // relative path here 404s on the API itself.
      loginPage: 'https://recomend.app/auth/login',
      consentPage: 'https://recomend.app/auth/consent',
      resource: 'https://api.recomend.app/mcp',
    }) as unknown as BetterAuthPlugin,
    cimd({
      fetchClientMetadataResource,
      metadataProfile: 'mcp-2026-07-28',
    }),
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  user: {
    additionalFields: additionalFields,
  },
  advanced: {
    database: {
      joins: true,
    },
  },
});
