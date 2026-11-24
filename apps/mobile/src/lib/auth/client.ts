import { createAuthClient } from 'better-auth/react';
import { expoClient, getSetCookie, storageAdapter } from '@better-auth/expo/client';
import {
  emailOTPClient,
  inferAdditionalFields,
  magicLinkClient,
  usernameClient,
} from 'better-auth/client/plugins';
import { API_URL, SCHEME } from '../../env';
import * as SecureStore from 'expo-secure-store';
import type { auth } from '@libs/db';

export const authClient = createAuthClient({
  baseURL: API_URL,
  basePath: '/auth',
  plugins: [
    usernameClient(),
    magicLinkClient(),
    inferAdditionalFields<typeof auth>(),
    emailOTPClient(),
    expoClient({
      scheme: SCHEME,
      storagePrefix: SCHEME,
      // cookiePrefix: AUTH_COOKIE_PREFIX || SCHEME,
      storage: SecureStore,
    }),
  ],
});

// Ours, and the jar below is named after it: `${storagePrefix}_cookie` is how
// expoClient derives the key it stores cookies under.
const COOKIE_JAR_KEY = `${SCHEME}_cookie`;

// The same wrapper expoClient puts around the store, for the same reason: it
// chunks values SecureStore would refuse whole.
const jar = storageAdapter(SecureStore);

/**
 * Puts back the `+` that a query-string decoder read as a space.
 *
 * better-call signs a session cookie with `btoa`, so its signature is standard
 * base64 and holds a `+` about half the time. The cookie travels to the app as
 * a deep-link param, where that `+` percent-encodes correctly and comes back
 * out as a space -- and a signature with a space in it fails `atob`, so the API
 * answers "no session" with no error at all. A cookie value cannot legally hold
 * a space (RFC 6265), so every space in it is a `+` to restore. Only the value
 * is touched; the attributes after the first `;` keep their spaces.
 */
const restorePlusSigns = (setCookieHeader: string) => {
  const end = setCookieHeader.indexOf(';');
  const pair = end === -1 ? setCookieHeader : setCookieHeader.slice(0, end);
  const separator = pair.indexOf('=');
  if (separator === -1) return setCookieHeader;
  const repaired = pair.slice(0, separator + 1) + pair.slice(separator + 1).replace(/ /g, '+');
  return end === -1 ? repaired : repaired + setCookieHeader.slice(end);
};

/**
 * Stores a `set-cookie` header in the jar this client sends from.
 *
 * The plugin does this itself for every response the app receives, from its
 * fetch hook. This is for a cookie that arrives without a request: the deep
 * link of a verification mail, where the plugin's server hook has appended the
 * session it gave the browser as a `cookie` param.
 *
 * Throws if the client cannot read the cookie back afterwards -- the plugin
 * offers no setter, so the jar is reached by the key it derives, and a
 * convention that changed under us has to fail loudly rather than sign nobody
 * in.
 */
export const storeSessionCookie = async (setCookieHeader: string) => {
  const header = restorePlusSigns(setCookieHeader);
  const current = await jar.getItemAsync(COOKIE_JAR_KEY);
  await jar.setItemAsync(COOKIE_JAR_KEY, getSetCookie(header, current ?? undefined));
  if (!(await authClient.getCookie())) {
    throw new Error(`Nothing readable in the cookie jar (${COOKIE_JAR_KEY})`);
  }
};

/**
 * Empties the jar, the way the plugin does on sign-out.
 *
 * A cookie the API does not recognise must not be left there: the next request
 * would carry it, the API would answer it with a cookie-clearing `set-cookie`,
 * and that answer landing late can empty the jar under a later handover.
 * Clearing it keeps each attempt independent of the last.
 */
export const clearSessionCookie = async () => {
  await jar.setItemAsync(COOKIE_JAR_KEY, '{}');
};

export const { signIn, signUp, useSession, signOut } = authClient;
