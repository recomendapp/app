import { createAuthClient } from 'better-auth/react';
import { magicLinkClient, usernameClient } from "better-auth/client/plugins";
import { API_URL } from '../env';

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: '/auth',
  plugins: [
    usernameClient(),
    magicLinkClient(),
  ]
});

export const { signIn, signUp, useSession, signOut } = authClient;
