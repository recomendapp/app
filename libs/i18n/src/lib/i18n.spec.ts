import { getFallbackLocale } from './i18n';

describe('getFallbackLocale', () => {
  it('returns null for the default locale (en-US)', () => {
    expect(getFallbackLocale({ locale: 'en-US' })).toBeNull();
  });

  // NOTE: the per-language-family mapping (fr-CA -> fr-FR, es-MX -> es-ES,
  // ar-EG -> ar-SA, etc.) is written out below but entirely commented out in
  // getFallbackLocale.ts, so every non-default locale currently falls back to
  // defaultSupportedLocale ('en-US') regardless of its language family. This
  // is dormant/WIP rather than actively broken today, since getDictionary()
  // has the same 2-locale (en-US/fr-FR) limitation — but it's worth flagging:
  // once more dictionaries are added, this will start merging English into
  // e.g. Arabic or Spanish fallbacks instead of the linguistically correct
  // family default. Locking in the CURRENT behavior here so any change is
  // deliberate.
  it('currently falls back to the default locale for every non-default locale, regardless of language family', () => {
    expect(getFallbackLocale({ locale: 'fr-FR' })).toBe('en-US');
    expect(getFallbackLocale({ locale: 'fr-CA' })).toBe('en-US');
    expect(getFallbackLocale({ locale: 'es-ES' })).toBe('en-US');
    expect(getFallbackLocale({ locale: 'ar-SA' })).toBe('en-US');
    expect(getFallbackLocale({ locale: 'ja-JP' })).toBe('en-US');
  });
});
