import { createAuthClient } from 'better-auth/react';
import {
  emailOTPClient,
  inferAdditionalFields,
  magicLinkClient,
  usernameClient,
} from 'better-auth/client/plugins';
import { oauthProviderClient } from '@better-auth/oauth-provider/client';
import type { auth } from '@libs/db';

export const createAppAuthClient = (baseURL: string) =>
  createAuthClient({
    baseURL,
    basePath: '/auth',
    plugins: [
      usernameClient(),
      magicLinkClient(),
      inferAdditionalFields<typeof auth>(),
      emailOTPClient(),
      oauthProviderClient(),
    ],
  });
