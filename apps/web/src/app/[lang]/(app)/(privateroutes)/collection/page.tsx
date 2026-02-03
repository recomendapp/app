import { upperFirst } from 'lodash';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Collection from './_components/Collection';
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
    title: upperFirst(t('messages.library')),
    robots: {
      index: false,
      follow: false,
    }
  };
}

export default function CollectionPage () {
	return <Collection />
};