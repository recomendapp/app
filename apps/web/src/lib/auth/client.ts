import { createAppAuthClient } from '.';
import { API_URL } from '../env';

export const authClient = createAppAuthClient(API_URL);

export const { signIn, signUp, useSession, signOut } = authClient;
