import { cache } from 'react';
import { getApi, GetApiOptions } from '../api/server';
import { meControllerGet } from '@libs/api-js';
import { headers } from 'next/headers';
import { authClient } from './client';

export const getSession = cache(async () => {
  const h = await headers();
  const { data: session } = await authClient.getSession({
    fetchOptions: {
      headers: h,
    },
  });
  return session;
});

export const getMe = cache(async (props?: GetApiOptions) => {
  const client = await getApi(props);
  return await meControllerGet({ client });
});
