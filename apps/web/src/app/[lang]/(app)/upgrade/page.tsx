import { Upgrade } from './_components/Upgrade';
import { getTranslations } from 'next-intl/server';
import { upperFirst } from 'lodash';
import { siteConfig } from '@/config/site';
import { Metadata } from 'next';
import { SupportedLocale } from '@libs/i18n';
import { generateStaticAlternates } from '@/lib/i18n/routing';

export async function generateMetadata(props: {
  params: Promise<{
    lang: string;
  }>;
}): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  return {
    title: upperFirst(t('pages.upgrade.metadata.title')),
    description: upperFirst(t('pages.upgrade.metadata.description', { app: siteConfig.name })),
    alternates: generateStaticAlternates(params.lang, '/upgrade'),
  };
}

export default async function UpgradePage() {
  return <Upgrade />;
}
