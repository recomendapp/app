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
  const t = await getTranslations({ locale: params.lang as SupportedLocale, namespace: 'common' });
  return {
    title: upperFirst(t('messages.an_error_occurred'))
  }
}

interface AuthErrorLayoutProps {
  children: React.ReactNode;
}

export default function AuthErrorLayout({ children }: AuthErrorLayoutProps) {
  return (children);
}
