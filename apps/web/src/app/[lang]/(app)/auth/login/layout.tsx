import { siteConfig } from '@/config/site';
import { SupportedLocale } from '@/translations/locales';
import { upperFirst } from 'lodash';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

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
    title: upperFirst(t('common.messages.login')),
    description: t('pages.auth.login.metadata.description', { app: siteConfig.name }),
  };
}

interface LoginLayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (children);
}
