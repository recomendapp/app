import { defaultSupportedLocale, type SupportedLocale } from '../locales';

/**
 * Locales that are merged under another locale before the default one, because
 * a closer variant of the same language reads better than English for a key
 * that locale is missing.
 *
 * zh-CN and zh-TW are deliberately absent: they use different scripts, so
 * mixing them on one screen is worse than falling back to English.
 */
const CLOSEST_SUPPORTED_LOCALE: Partial<Record<SupportedLocale, SupportedLocale>> = {
  'es-MX': 'es-ES',
  'fr-CA': 'fr-FR',
  'pt-BR': 'pt-PT',
  'zh-HK': 'zh-TW',
};

/**
 * Get the fallback locale for a given locale
 *
 * Callers merge dictionaries from the end of the chain up, so every chain has
 * to end on `defaultSupportedLocale` and must never loop.
 *
 * @param locale - The locale to get the fallback locale for
 * @returns The fallback locale or null if the locale is the default
 * @category i18n
 * @module getFallbackLocale
 *
 * @example
 * ```tsx
 * // 'fr-FR', which in turn falls back to 'en-US'
 * const fallbackLocale = getFallbackLocale({ locale: 'fr-CA' });
 * ```
 * @example
 * ```tsx
 * // 'en-US'
 * const fallbackLocale = getFallbackLocale({ locale: 'de-DE' });
 * ```
 */
export const getFallbackLocale = ({
  locale,
}: {
  locale: SupportedLocale;
}): SupportedLocale | null => {
  if (locale === defaultSupportedLocale) return null;

  return CLOSEST_SUPPORTED_LOCALE[locale] ?? defaultSupportedLocale;
};
