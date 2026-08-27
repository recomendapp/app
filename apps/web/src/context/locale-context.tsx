'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import type { getMessages } from 'next-intl/server';
import { SupportedLocale } from '@libs/i18n';

export const LocaleProvider = ({
  locale,
  messages,
  children,
}: {
  locale: SupportedLocale;
  messages: Awaited<ReturnType<typeof getMessages>>;
  children: React.ReactNode;
}) => {
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined);

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
};
