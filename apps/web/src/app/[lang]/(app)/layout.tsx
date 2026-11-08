import { AppLayout } from '@/layouts/app-layout/AppLayout';
import { SupportBanner } from '@/components/SupportBanner';
import { routing } from '@/lib/i18n/routing';
import { SupportedLocale } from '@libs/i18n';
import { notFound } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function RootLayout({ children, modal, params }: AppLayoutProps) {
  const { lang } = await params;
  if (routing.locales.includes(lang as SupportedLocale) === false) {
    notFound();
  }
  return (
    <>
      <SupportBanner />
      <AppLayout>
        {children}
        {modal}
      </AppLayout>
    </>
  );
}
