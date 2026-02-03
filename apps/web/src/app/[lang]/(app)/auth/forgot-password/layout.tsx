import { SupportedLocale } from '@/translations/locales';
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
  const t = await getTranslations({ locale: params.lang as SupportedLocale, namespace: 'pages.auth.forgot_password' });
  return {
    title: t('metadata.title'),
    description: t('metadata.description'),
  };
}

interface ForgotPasswordLayoutProps {
  children: React.ReactNode;
}

export default function ForgotPasswordLayout({ children }: ForgotPasswordLayoutProps) {
  return (children);
}
