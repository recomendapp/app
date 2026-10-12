import { defineRouting } from 'next-intl/routing';
import { AlternateURLs } from 'next/dist/lib/metadata/types/alternative-urls-types';
import { siteConfig } from '@/config/site';
import { defaultSupportedLocale, supportedLocales } from '@libs/i18n';

export const localeCookieName = 'LOCALE';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: supportedLocales,
  // Used when no locale matches
  defaultLocale: defaultSupportedLocale,
  localePrefix: 'as-needed',
  localeCookie: {
    name: localeCookieName,
  },
});

const normalize = (endpoint: string) => (endpoint.startsWith('/') ? endpoint : `/${endpoint}`);

/** Absolute URL of `endpoint` as `locale` serves it. The default locale is unprefixed. */
export const localeUrl = (locale: string, endpoint: string) =>
  `${siteConfig.url}${locale === routing.defaultLocale ? '' : `/${locale}`}${normalize(endpoint)}`;

/**
 * For pages whose content is identical whatever the locale -- a profile, a playlist, a
 * user's log. Only the surrounding chrome is translated, so every locale points at the
 * one unprefixed URL rather than asking Google to index near-duplicates of it.
 *
 * Deliberately no `languages`: an hreflang set is a claim that genuinely different
 * language versions exist, and here they don't.
 */
export const generateAlternates = (currentLocale: string, endpoint: string): AlternateURLs => ({
  canonical: `${siteConfig.url}${normalize(endpoint)}`,
});

/** A locale and the path it serves an entity at; the slug follows the localized title. */
export type LocalizedAlternate = { locale: string; path: string };

/**
 * For pages whose content really is translated -- TMDB media.
 *
 * `alternates` comes from the entity's `/metadata` endpoint, per entity rather than as a
 * constant: a film averages ~22 translated locales but ranges from 0 to 58. Each entry
 * carries its own path because the slug follows the localized title, and an hreflang
 * href has to match the target page's own canonical exactly or Google discards it.
 *
 * Left empty, only the canonical is emitted -- correct, just without the annotations.
 */
export const generateLocalizedAlternates = (
  currentLocale: string,
  endpoint: string,
  alternates: readonly LocalizedAlternate[] = [],
): AlternateURLs => {
  if (alternates.length === 0) return { canonical: localeUrl(currentLocale, endpoint) };

  const defaultPath =
    alternates.find((alternate) => alternate.locale === routing.defaultLocale)?.path ?? endpoint;

  return {
    canonical: localeUrl(currentLocale, endpoint),
    languages: {
      ...Object.fromEntries(
        alternates.map((alternate) => [
          alternate.locale,
          localeUrl(alternate.locale, alternate.path),
        ]),
      ),
      'x-default': `${siteConfig.url}${normalize(defaultPath)}`,
    },
  };
};

/**
 * Appends a sub-path to every alternate, for pages nested under an entity
 * (`/film/<slug>/reviews`, `/tv-series/<slug>/season/2`). The slug still has to be the
 * localized one, so the sub-path is appended to each locale's own path rather than
 * rebuilt from the current locale's.
 */
export const withSubPath = (
  alternates: readonly LocalizedAlternate[] | undefined,
  subPath: string,
): LocalizedAlternate[] | undefined =>
  alternates?.map((alternate) => ({ ...alternate, path: `${alternate.path}${subPath}` }));

/** hreflang map for one path shared by every locale -- the static, UI-only pages. */
export const localeAlternates = (endpoint: string, locales: readonly string[]) => ({
  ...Object.fromEntries(locales.map((locale) => [locale, localeUrl(locale, endpoint)])),
  'x-default': `${siteConfig.url}${normalize(endpoint)}`,
});

export const sitemapLocales = (endpoint: string) => localeAlternates(endpoint, supportedLocales);
