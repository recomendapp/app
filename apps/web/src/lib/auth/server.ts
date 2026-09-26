import { cache } from 'react';
import { getApi, GetApiOptions } from '../api/server';
import { meControllerGet } from '@libs/api-js';
import { headers } from 'next/headers';
import { createAppAuthClient } from '.';
import { INTERNAL_API_URL } from '../env';

export const authClient = createAppAuthClient(INTERNAL_API_URL);

export const getSessionFromHeaders = async (h: Headers) => {
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: { cookie: h.get('cookie') || '' },
    },
  });
  return session;
};

export const getSession = cache(async () => getSessionFromHeaders(await headers()));

export const getMe = cache(async (props?: GetApiOptions) => {
  const client = await getApi(props);
  return await meControllerGet({ client });
});
