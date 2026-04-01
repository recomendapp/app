'use client';

import { HEADER_LANGUAGE_KEY } from '@libs/i18n/src';
import { client } from '@packages/api-js';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';
import { API_ENDPOINT } from '../env';

client.setConfig({
  baseUrl: API_ENDPOINT || 'https://api.recomend.app/v1',
  credentials: 'include',
});

export const ApiProvider = ({ children }: { children?: React.ReactNode }) => {
  const locale = useLocale();

  useEffect(() => {
    client.setConfig({
      headers: {
        [HEADER_LANGUAGE_KEY]: locale,
      },
    });
  }, [locale]);

  return children;
};
