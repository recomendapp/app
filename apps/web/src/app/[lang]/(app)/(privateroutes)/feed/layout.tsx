import { ReactNode } from 'react';
import { FeedNavbar } from './_components/FeedNavbar';
import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';
import { Metadata } from 'next';
import { SupportedLocale } from '@/translations/locales';

export async function generateMetadata(
  props: {
      params: Promise<{
        lang: string;
      }>;
    }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale, namespace: 'common' });
  return {
    title: upperFirst(t('messages.feed')),
    robots: {
      index: false,
      follow: false,
    }
  };
}

export default function FeedLayout ({ children } : { children: ReactNode}) {
	return (
		<div className='p-2 flex flex-col items-center'>
			<FeedNavbar />
			{children}
		</div>
	);
};