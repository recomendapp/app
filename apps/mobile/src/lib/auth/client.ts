import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { emailOTPClient, inferAdditionalFields, magicLinkClient, usernameClient } from "better-auth/client/plugins";
import { API_URL, SCHEME } from 'apps/mobile/src/env';
import * as SecureStore from 'expo-secure-store';
import { auth } from '@libs/db';

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: '/auth',
  plugins: [
    expoClient({
      scheme: SCHEME,
      storagePrefix: SCHEME,
      // cookiePrefix: AUTH_COOKIE_PREFIX || SCHEME,
      storage: SecureStore,
    }),
    usernameClient(),
    magicLinkClient(),
    inferAdditionalFields<typeof auth>(),
    emailOTPClient()
  ],
});

export const { signIn, signUp, useSession, signOut } = authClient;
