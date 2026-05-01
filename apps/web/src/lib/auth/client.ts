import { createAuthClient } from 'better-auth/react';
import { emailOTPClient, inferAdditionalFields, magicLinkClient, usernameClient } from "better-auth/client/plugins";
import { API_URL } from '../env';
import type { auth } from "@libs/db";

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: '/auth',
  plugins: [
    usernameClient(),
    magicLinkClient(),
    inferAdditionalFields<typeof auth>(),
    emailOTPClient()
  ],
});

export const { signIn, signUp, useSession, signOut } = authClient;
