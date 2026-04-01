import { API_ENDPOINT } from 'apps/mobile/src/env';
import { client } from '@packages/api-js';
import { authClient } from '../auth/client';

client.setConfig({
  baseUrl: API_ENDPOINT,
});

client.interceptors.request.use(async (config) => {
  const cookie = authClient.getCookie();
  if (cookie) {
    config.headers.set('Cookie', cookie);
  }
  return config;
});
