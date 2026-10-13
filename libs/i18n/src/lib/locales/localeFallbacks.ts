import type { SupportedLocale } from './supportedLocales';

/**
 * Maps a language tag we ship no dictionary for onto the closest locale we do.
 *
 * Feeds `nestjs-i18n`'s `fallbacks` option in apps/api and apps/notify, where
 * it only kicks in for tags that have no directory under `assets/i18n` — an
 * exact locale such as `de-DE` is always served by its own dictionary.
 *
 * Two traps:
 * - `resolveLanguage()` matches `key === lang` or `key === '<language>-*'` in
 *   insertion order and stops at the first hit, so exact tags must come first.
 * - never add a bare language key (`'de'`): on a missing key nestjs-i18n strips
 *   the region to build its next attempt (`de-DE` -> `de`), so `'de': 'de-DE'`
 *   would send it back to `de-DE` and the key would never reach `en-US`.
 *
 * @category i18n
 * @module localeFallbacks
 */
export const localeFallbacks: Record<string, SupportedLocale> = {
  // Chinese: the script matters more than the region, and a traditional-script
  // tag must never land on the simplified dictionary (or the other way round).
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
  'zh-Hant-TW': 'zh-TW',
  'zh-Hant-HK': 'zh-HK',
  'zh-Hant-MO': 'zh-HK',
  'zh-MO': 'zh-HK',

  // Norwegian is tagged by language, not region: nb/nn never match 'no-*'.
  'nb-*': 'no-NO',
  'nn-*': 'no-NO',
  // Legacy Hebrew code still emitted by some Android/Java clients.
  'iw-*': 'he-IL',

  'ar-*': 'ar-SA',
  'bg-*': 'bg-BG',
  'ca-*': 'ca-ES',
  'cs-*': 'cs-CZ',
  'da-*': 'da-DK',
  'de-*': 'de-DE',
  'el-*': 'el-GR',
  'en-*': 'en-US',
  'es-*': 'es-ES',
  'et-*': 'et-EE',
  'fa-*': 'fa-IR',
  'fi-*': 'fi-FI',
  'fr-*': 'fr-FR',
  'he-*': 'he-IL',
  'hi-*': 'hi-IN',
  'hr-*': 'hr-HR',
  'hu-*': 'hu-HU',
  'it-*': 'it-IT',
  'ja-*': 'ja-JP',
  'ka-*': 'ka-GE',
  'ko-*': 'ko-KR',
  'lt-*': 'lt-LT',
  'lv-*': 'lv-LV',
  'nl-*': 'nl-NL',
  'no-*': 'no-NO',
  'pl-*': 'pl-PL',
  'pt-*': 'pt-PT',
  'ro-*': 'ro-RO',
  'ru-*': 'ru-RU',
  'sk-*': 'sk-SK',
  'sl-*': 'sl-SI',
  'sr-*': 'sr-RS',
  'sv-*': 'sv-SE',
  'th-*': 'th-TH',
  'tr-*': 'tr-TR',
  'uk-*': 'uk-UA',
  'vi-*': 'vi-VN',
  'zh-*': 'zh-CN',
};
