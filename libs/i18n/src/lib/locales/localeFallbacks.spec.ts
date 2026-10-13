import { describe, it, expect } from 'bun:test';
import { localeFallbacks } from './localeFallbacks';
import { supportedLocales, type SupportedLocale } from './supportedLocales';

const languageOf = (locale: string) => locale.split('-')[0];

describe('localeFallbacks', () => {
  it('only ever targets a supported locale', () => {
    for (const target of Object.values(localeFallbacks)) {
      expect(supportedLocales).toContain(target);
    }
  });

  it('covers every supported language with a wildcard pattern', () => {
    const languages = new Set(supportedLocales.map(languageOf));

    for (const language of languages) {
      expect(localeFallbacks[`${language}-*`]).toBeTruthy();
    }
  });

  it('targets a locale of the same language, except for the legacy codes', () => {
    const aliases: Record<string, string> = { iw: 'he', nb: 'no', nn: 'no' };

    for (const [pattern, target] of Object.entries(localeFallbacks)) {
      const language = languageOf(pattern);
      expect(languageOf(target)).toBe(aliases[language] ?? language);
    }
  });

  it('matches exact tags before wildcards, as nestjs-i18n resolves them in insertion order', () => {
    const patterns = Object.keys(localeFallbacks);
    const firstWildcard = patterns.findIndex((pattern) => pattern.endsWith('-*'));

    expect(firstWildcard).toBeGreaterThan(0);
    expect(patterns.slice(firstWildcard).every((pattern) => pattern.endsWith('-*'))).toBe(true);
  });

  it('declares no bare language key, which would trap a missing key away from en-US', () => {
    for (const pattern of Object.keys(localeFallbacks)) {
      expect(pattern).toInclude('-');
    }
  });

  it('keeps the two Chinese scripts apart', () => {
    expect(localeFallbacks['zh-Hant']).toBe('zh-TW');
    expect(localeFallbacks['zh-Hant-HK']).toBe('zh-HK');
    expect(localeFallbacks['zh-MO']).toBe('zh-HK');
    expect(localeFallbacks['zh-*']).toBe('zh-CN');
  });

  it('does not list a supported locale as a pattern, since those load their own dictionary', () => {
    for (const pattern of Object.keys(localeFallbacks)) {
      expect(supportedLocales).not.toContain(pattern as SupportedLocale);
    }
  });
});
