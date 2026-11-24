import * as SecureStore from 'expo-secure-store';
import { randomUUID } from 'expo-crypto';
import { SCHEME } from '../../env';

const HANDOVER_KEY = `${SCHEME}_email_handover`;

/**
 * The value a verification link must carry back for its session to be taken.
 *
 * A deep link on a custom scheme is an unauthenticated channel: anyone can open
 * one, with any `cookie` in it. Issued here when the mail is asked for and kept
 * on the device, this is what tells our own link apart from a fabricated one --
 * without it, a crafted link would sign a reader into somebody else's account.
 */
export const issueEmailHandoverToken = async () => {
  const token = randomUUID();
  await SecureStore.setItemAsync(HANDOVER_KEY, token);
  return token;
};

/** Read once, then gone: a link hands over a session once, on this device. */
export const consumeEmailHandoverToken = async () => {
  const token = await SecureStore.getItemAsync(HANDOVER_KEY);
  if (token) await SecureStore.deleteItemAsync(HANDOVER_KEY);
  return token;
};
