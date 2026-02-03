import { betterAuth } from 'better-auth';
import { magicLink, openAPI, username } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db/client';

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
    additionalFields: {
      usernameUpdatedAt: {
        type: 'date',
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },
  experimental: {
    joins: true,
  },
});