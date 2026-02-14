import { client } from '@packages/api-js';
import { getLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { HEADER_LANGUAGE_KEY } from '@libs/i18n';
import { SupportedLocale } from '@libs/i18n/src';
import { API_ENDPOINT } from '../env';

export interface GetApiOptions {
  headers?: Headers;
  locale?: SupportedLocale;
}

export const getApi = async ({
  headers: customHeaders,
  locale,
}: GetApiOptions = {}) => {
  const [h, l] = await Promise.all([
    customHeaders || headers(),
    locale || getLocale(),
  ]);

  client.setConfig({
    baseUrl: API_ENDPOINT,
    headers: {
      cookie: h.get('cookie') || '',
      [HEADER_LANGUAGE_KEY]: l,
    },
    
  });

  return client;
};

export const getAnonApi = async ({
  locale,
}: {
  locale?: SupportedLocale;
} = {}) => {
  const l = locale || await getLocale();

  client.setConfig({
    baseUrl: API_ENDPOINT,
    headers: {
      [HEADER_LANGUAGE_KEY]: l,
    },
  });

  return client;
};
