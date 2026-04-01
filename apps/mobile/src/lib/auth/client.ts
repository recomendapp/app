import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import { API_URL, SCHEME } from 'apps/mobile/src/env';
import * as SecureStore from 'expo-secure-store';

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
  ],
});

export const { signIn, signUp, useSession, signOut } = authClient;
