import { defineRouting } from 'next-intl/routing';
import { AlternateURLs } from 'next/dist/lib/metadata/types/alternative-urls-types';
import { siteConfig } from '@/config/site';
import { defaultSupportedLocale, supportedLocales } from '@/translations/locales';

export const localeCookieName = 'LOCALE';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: supportedLocales,
  // Used when no locale matches
  defaultLocale: defaultSupportedLocale,
  // Prefix for all locale-aware routes
  localePrefix: 'as-needed',
  localeCookie: {
    name: localeCookieName,
  }
});

export const generateAlternates = (currentLocale: string, endpoint: string): AlternateURLs => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const localePrefix = currentLocale === routing.defaultLocale ? '' : `/${currentLocale}`;
  return {
    canonical: `${siteConfig.url}${localePrefix}${normalizedEndpoint}`,
    languages: {
      'x-default': `${siteConfig.url}${normalizedEndpoint}`,
    }
  };
};

export const sitemapLocales = (endpoint: string) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return Object.fromEntries(
    routing.locales.map((locale) => {
      const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
      return [locale, `${siteConfig.url}${prefix}${normalizedEndpoint}`];
    })
  );
};