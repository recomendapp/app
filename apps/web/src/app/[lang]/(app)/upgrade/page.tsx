import { Upgrade } from './_components/Upgrade';
import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';
import { siteConfig } from '@/config/site';
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
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  return {
    title: upperFirst(t('pages.upgrade.metadata.title')),
    description: upperFirst(t('pages.upgrade.metadata.description', { app: siteConfig.name })),
  };
}

export default async function UpgradePage() {
  return <Upgrade />;
}
