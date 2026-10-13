import { describe, it, expect } from 'bun:test';
import { getFallbackLocale } from './i18n';
import { defaultSupportedLocale, supportedLocales, type SupportedLocale } from './locales';

describe('getFallbackLocale', () => {
  it('returns null for the default locale (en-US)', () => {
    expect(getFallbackLocale({ locale: 'en-US' })).toBeNull();
  });

  it('falls back to the closest variant of the same language when there is one', () => {
    expect(getFallbackLocale({ locale: 'fr-CA' })).toBe('fr-FR');
    expect(getFallbackLocale({ locale: 'es-MX' })).toBe('es-ES');
    expect(getFallbackLocale({ locale: 'pt-BR' })).toBe('pt-PT');
    expect(getFallbackLocale({ locale: 'zh-HK' })).toBe('zh-TW');
  });

  it('falls back to the default locale for a language with a single variant', () => {
    expect(getFallbackLocale({ locale: 'de-DE' })).toBe('en-US');
    expect(getFallbackLocale({ locale: 'ja-JP' })).toBe('en-US');
    expect(getFallbackLocale({ locale: 'ar-SA' })).toBe('en-US');
  });

  it('falls back to the default locale for the base variant of a language', () => {
    expect(getFallbackLocale({ locale: 'fr-FR' })).toBe('en-US');
    expect(getFallbackLocale({ locale: 'es-ES' })).toBe('en-US');
    expect(getFallbackLocale({ locale: 'pt-PT' })).toBe('en-US');
  });

  it('never mixes the two Chinese scripts', () => {
    expect(getFallbackLocale({ locale: 'zh-CN' })).toBe('en-US');
    expect(getFallbackLocale({ locale: 'zh-TW' })).toBe('en-US');
  });

  it('builds a loop-free chain down to the default locale for every supported locale', () => {
    for (const locale of supportedLocales) {
      const seen = new Set<SupportedLocale>([locale]);
      let current: SupportedLocale | null = locale;
      let last: SupportedLocale = locale;

      while (current) {
        last = current;
        const next: SupportedLocale | null = getFallbackLocale({ locale: current });
        if (next) {
          expect(seen.has(next)).toBe(false);
          expect(supportedLocales).toContain(next);
          seen.add(next);
        }
        current = next;
      }

      expect(last).toBe(defaultSupportedLocale);
    }
  });
});
