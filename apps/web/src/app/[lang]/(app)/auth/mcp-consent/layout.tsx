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
    title: upperFirst(t('pages.auth.mcp_consent.label')),
    robots: {
      index: false,
      follow: false,
    },
  };
}

interface McpConsentLayoutProps {
  children: React.ReactNode;
}

const McpConsentLayout = ({ children }: McpConsentLayoutProps) => children;

export default McpConsentLayout;
