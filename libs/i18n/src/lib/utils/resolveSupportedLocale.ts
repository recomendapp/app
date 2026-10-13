import {
  defaultSupportedLocale,
  isSupportedLocale,
  localeFallbacks,
  type SupportedLocale,
} from '../locales';

/**
 * Canonicalize a BCP-47 tag: lowercase language, Titlecase script, uppercase
 * region. Browsers and devices are inconsistent here (`fr_FR`, `ZH-HANT-TW`),
 * and both `isSupportedLocale` and `localeFallbacks` are case-sensitive.
 */
const canonicalize = (locale: string): string => {
  const [language = '', ...rest] = locale.trim().replace(/_/g, '-').split('-');

  return [
    language.toLowerCase(),
    ...rest.map((part) =>
      part.length === 4 ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part.toUpperCase(),
    ),
  ].join('-');
};

/**
 * Resolve any language tag to the locale whose dictionary we should serve
 *
 * This is the client-side counterpart of `localeFallbacks`, which `nestjs-i18n`
 * applies on its own in apps/api and apps/notify: an exact supported locale is
 * kept, anything else lands on the closest locale of the same language, and a
 * language we do not ship at all lands on the default locale.
 *
 * @param locale - The language tag to resolve, from a header, a device or storage
 * @returns A supported locale, always
 * @category i18n
 * @module resolveSupportedLocale
 *
 * @example
 * ```tsx
 * resolveSupportedLocale('de-AT'); // 'de-DE'
 * resolveSupportedLocale('zh-Hant-HK'); // 'zh-HK'
 * resolveSupportedLocale('sw-TZ'); // 'en-US'
 * ```
 */
export const resolveSupportedLocale = (locale: string | null | undefined): SupportedLocale => {
  if (!locale) return defaultSupportedLocale;

  const tag = canonicalize(locale);
  if (isSupportedLocale(tag)) return tag;

  const exact = localeFallbacks[tag];
  if (exact) return exact;

  const language = tag.split('-')[0];
  const byLanguage = language ? localeFallbacks[`${language}-*`] : undefined;

  return byLanguage ?? defaultSupportedLocale;
};
