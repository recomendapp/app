import { Metadata } from 'next';
import { Map } from '@/components/Map/Map';
import { getTranslations } from 'next-intl/server';
import { truncate } from 'lodash';
import { siteConfig } from '@/config/site';
import { generateAlternates } from '@/lib/i18n/routing';
import { SupportedLocale } from '@/translations/locales';

export async function generateMetadata(
  props: {
    params: Promise<{
      lang: string;
    }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  return {
    title: t('pages.explore.metadata.title'),
    description: truncate(t('pages.explore.metadata.description'), { length: siteConfig.seo.description.limit }),
    alternates: generateAlternates(params.lang, '/explore'),
    openGraph: {
      siteName: siteConfig.name,
      title: `${t('pages.explore.metadata.title')} • ${siteConfig.name}`,
      description: truncate(t('pages.explore.metadata.description'), { length: siteConfig.seo.description.limit }),
      // TODO
      // images: [

      // ]
      url: `${siteConfig.url}/${params.lang}/explore`,
      type: 'website',
      locale: params.lang,
    },
  };
};

export default function MapPage(
  props: {
    params: Promise<{
      lang: string;
    }>;
  }
) {
  return <Map />;
}
