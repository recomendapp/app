import { cache } from 'react';
import { getApi, GetApiOptions } from '../api/server';
import { meControllerGet } from '@libs/api-js';

export const getMe = cache(async (props?: GetApiOptions) => {
  const client = await getApi(props);
  return await meControllerGet({client});
});
