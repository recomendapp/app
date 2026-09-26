import { SupportedLocale } from '@libs/i18n';
import { upperFirst } from 'lodash';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const t = await getTranslations({ locale: params.lang as SupportedLocale });
  return {
    title: upperFirst(t('pages.auth.consent.label')),
    robots: {
      index: false,
      follow: false,
    },
  };
}

interface ConsentLayoutProps {
  children: React.ReactNode;
}

const ConsentLayout = ({ children }: ConsentLayoutProps) => children;

export default ConsentLayout;
