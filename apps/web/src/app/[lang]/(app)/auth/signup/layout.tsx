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
    title: upperFirst(t('common.messages.signup')),
    description: t('pages.auth.signup.metadata.description', { app: siteConfig.name }),
  };
}

interface SignupLayoutProps {
  children: React.ReactNode;
}

export default function SignupLayout({ children }: SignupLayoutProps) {
  return (children);
}
