import { API_ENDPOINT, API_URL } from 'apps/mobile/src/env';
import { client, realtime } from '@packages/api-js';
import { authClient } from '../auth/client';

client.setConfig({
  baseUrl: API_ENDPOINT || 'https://api.recomend.app/v1',
  credentials: 'include',
});

client.interceptors.request.use(async (config) => {
  const cookie = authClient.getCookie();
  if (cookie) {
    config.headers.set('Cookie', cookie);
  }
  return config;
});

realtime.setConfig({
  baseUrl: API_URL || 'https://api.recomend.app',
  getAuthCookie: () => {
    const token = authClient.getCookie();
    return token;
  }
});
