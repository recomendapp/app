'use client';

import { HEADER_LANGUAGE_KEY } from '@libs/i18n/src';
import { client, realtime } from '@libs/api-js';
import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { API_ENDPOINT, API_URL } from '../env';

client.setConfig({
  baseUrl: API_ENDPOINT || 'https://api.recomend.app/v1',
  credentials: 'include',
});

realtime.setConfig({
  baseUrl: API_URL || 'https://api.recomend.app',
});

export const ApiProvider = ({ children }: { children?: React.ReactNode }) => {
  const locale = useLocale();

  useMemo(() => {
    client.setConfig({
      headers: {
        [HEADER_LANGUAGE_KEY]: locale,
      },
    });
  }, [locale]);

  return children;
};
