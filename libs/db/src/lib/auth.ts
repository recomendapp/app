import { betterAuth } from 'better-auth';
import { magicLink, openAPI, username } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './client';
import { defaultSupportedLocale } from '@libs/i18n';

export const additionalFields = {
  usernameUpdatedAt: {
    type: 'date',
    required: false,
    defaultValue: null,
    input: false,
  },
  language: {
    type:  'string',
    defaultValue: defaultSupportedLocale,
    required: true,
    input: true,
  },
} as const;

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
      sendMagicLink: async () => { /* No-op for CLI */ },
    })
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
  experimental: {
    joins: true,
  },
});