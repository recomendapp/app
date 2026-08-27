'use client';

import { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import type { getMessages } from 'next-intl/server';
import { SupportedLocale } from '@libs/i18n';

export const LocaleProvider = ({
  locale,
  messages,
  timeZone: initialTimeZone,
  children,
}: {
  locale: SupportedLocale;
  messages: Awaited<ReturnType<typeof getMessages>>;
  timeZone: string;
  children: React.ReactNode;
}) => {
  const [timeZone, setTimeZone] = useState(initialTimeZone);

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
};
