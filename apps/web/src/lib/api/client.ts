'use client';

import { HEADER_LANGUAGE_KEY } from '@libs/i18n/src';
import { client } from '@packages/api-js';
import { useLocale } from 'next-intl';
import { useEffect } from 'react';

client.setConfig({
  baseUrl: process.env.NEXT_PUBLIC_API_HOST || 'https://api.woodn.fr',
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
