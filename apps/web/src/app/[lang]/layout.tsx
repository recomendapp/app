import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import { siteConfig } from '@/config/site';
import { fontSans } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { Providers } from '@/context/Providers';
import Script from 'next/script';
import { generateAlternates } from '@/lib/i18n/routing';
import { SupportedLocale } from '@/translations/locales';
import { getTranslations } from 'next-intl/server';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const t = await getTranslations();
  
  return {
    title: {
      default: `${siteConfig.name} • ${t('site.tagline')}`,
      template: `%s • ${siteConfig.name}`,
    },
    metadataBase: new URL(siteConfig.url),
    description: t('site.description', { app: siteConfig.name }),
    alternates: generateAlternates(lang, '/'),
    manifest: '/manifest.webmanifest',
    icons: {
      apple: '/assets/icons/ios/512.png',
    },
    appleWebApp: {
      title: siteConfig.name,
      statusBarStyle: 'default',
      startupImage: [
        '/assets/icons/ios/512.png',
        {
          url: '/assets/icons/ios/512.png',
          media: '(device-width: 768px) and (device-height: 1024px)',
        },
      ],
    },
    openGraph: {
      siteName: siteConfig.name,
      title: `${siteConfig.name} • ${t('site.tagline')}`,
      description: t('site.description', { app: siteConfig.name }),
      images: [
      ],
      type: 'website',
      url: siteConfig.url,
    },
    twitter: {
      site: `@${siteConfig.socials.twitter.username}`,
      creator: `@${siteConfig.by.twitter}`,
    },
  };
}

export default async function LangLayout({
  children,
  params
} : {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // Disable for RTL languages for now
  // const direction = getLangDir(lang);
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="search" type="application/opensearchdescription+xml" title="Recomend" href="/opensearch.xml" />
      </head>
      {process.env.NODE_ENV === 'production' && (
        <Script
        defer
        src={process.env.ANALYTICS_URL}
        data-website-id={process.env.ANALYTICS_ID}
        />
      )}
      <body className={cn('font-sans antialiased', fontSans.variable)}>
        <Providers locale={lang as SupportedLocale}>{children}</Providers>
      </body>
    </html>
  );
}
