import { createAuthClient } from 'better-auth/react';
import { magicLinkClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/auth`,
  plugins: [
    usernameClient(),
    magicLinkClient(),
  ]
});

export const { signIn, signUp, useSession, signOut } = authClient;
