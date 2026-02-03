import { AppLayout } from "@/layouts/app-layout/AppLayout";
import { routing } from "@/lib/i18n/routing";
import { SupportedLocale } from "@/translations/locales";
import { notFound } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: SupportedLocale }>;
};

export default async function RootLayout({
  children,
  params,
}: AppLayoutProps) {
  const { lang } = await params;
  if (routing.locales.includes(lang) === false) {
    notFound();
  }
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
};