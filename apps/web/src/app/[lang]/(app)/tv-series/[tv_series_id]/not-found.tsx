import { upperFirst } from 'lodash';
import { getLocale, getTranslations } from 'next-intl/server';
import React from 'react';

export default async function NotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale: locale, namespace: 'common' });
  return (
    <div
      className="bg-white w-full h-full flex justify-center items-center"
      style={{
        backgroundImage: `url('https://s.ltrbxd.com/static/img/errors/not-found-4.9da22e2b.jpg')`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="text-4xl font-bold">
      {upperFirst(t('messages.tv_series_not_found'))}
      </div>
    </div>
  );
}
