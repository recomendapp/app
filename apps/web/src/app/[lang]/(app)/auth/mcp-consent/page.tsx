import { ConsentForm } from './_components/ConsentForm';
import { getSession } from '@/lib/auth/server';
import { redirect } from '@/lib/i18n/navigation';
import { SupportedLocale } from '@libs/i18n';
import { getTranslations } from 'next-intl/server';
import { Icons } from '@/config/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@libs/ui/components/card';

interface McpConsentPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function McpConsent({ params, searchParams }: McpConsentPageProps) {
  const { lang } = await params;
  const query = await searchParams;

  const session = await getSession();
  if (!session) {
    const currentSearch = new URLSearchParams(
      Object.entries(query).flatMap(([key, value]) =>
        value === undefined ? [] : (Array.isArray(value) ? value : [value]).map((v) => [key, v]),
      ),
    ).toString();
    redirect({
      href: {
        pathname: '/auth/login',
        query: {
          redirect: currentSearch ? `/auth/mcp-consent?${currentSearch}` : '/auth/mcp-consent',
        },
      },
      locale: lang as SupportedLocale,
    });
  }

  const t = await getTranslations({
    locale: lang as SupportedLocale,
    namespace: 'pages.auth.mcp_consent',
  });

  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <Card className="@container w-full max-w-[400px]">
        <CardHeader className="gap-2">
          <CardTitle className="inline-flex gap-2 items-center justify-center">
            <Icons.site.icon className="fill-accent-yellow w-8" />
            {t('label')}
          </CardTitle>
          <CardDescription className="text-center">{t('description_generic')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ConsentForm />
        </CardContent>
      </Card>
    </div>
  );
}
