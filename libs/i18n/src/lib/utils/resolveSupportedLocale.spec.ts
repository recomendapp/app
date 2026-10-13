import { describe, it, expect } from 'bun:test';
import { resolveSupportedLocale } from './resolveSupportedLocale';
import { supportedLocales } from '../locales';

describe('resolveSupportedLocale', () => {
  it('returns the default locale for an empty value', () => {
    expect(resolveSupportedLocale(null)).toBe('en-US');
    expect(resolveSupportedLocale(undefined)).toBe('en-US');
    expect(resolveSupportedLocale('')).toBe('en-US');
  });

  it('keeps a supported locale as is', () => {
    for (const locale of supportedLocales) {
      expect(resolveSupportedLocale(locale)).toBe(locale);
    }
  });

  it('resolves an unsupported region to the locale we ship for that language', () => {
    expect(resolveSupportedLocale('de-AT')).toBe('de-DE');
    expect(resolveSupportedLocale('en-GB')).toBe('en-US');
    expect(resolveSupportedLocale('fr-BE')).toBe('fr-FR');
    expect(resolveSupportedLocale('es-AR')).toBe('es-ES');
    expect(resolveSupportedLocale('pt-AO')).toBe('pt-PT');
  });

  it('resolves a bare language tag', () => {
    expect(resolveSupportedLocale('de')).toBe('de-DE');
    expect(resolveSupportedLocale('ja')).toBe('ja-JP');
  });

  it('resolves the legacy codes some clients still send', () => {
    expect(resolveSupportedLocale('iw-IL')).toBe('he-IL');
    expect(resolveSupportedLocale('nb-NO')).toBe('no-NO');
    expect(resolveSupportedLocale('nn-NO')).toBe('no-NO');
  });

  it('sends a traditional-script Chinese tag to a traditional-script locale', () => {
    expect(resolveSupportedLocale('zh-Hant')).toBe('zh-TW');
    expect(resolveSupportedLocale('zh-Hant-TW')).toBe('zh-TW');
    expect(resolveSupportedLocale('zh-Hant-HK')).toBe('zh-HK');
    expect(resolveSupportedLocale('zh-MO')).toBe('zh-HK');
    expect(resolveSupportedLocale('zh-Hans')).toBe('zh-CN');
    expect(resolveSupportedLocale('zh-SG')).toBe('zh-CN');
  });

  it('accepts the casings and separators devices actually send', () => {
    expect(resolveSupportedLocale('fr_FR')).toBe('fr-FR');
    expect(resolveSupportedLocale('fr-fr')).toBe('fr-FR');
    expect(resolveSupportedLocale('PT-br')).toBe('pt-BR');
    expect(resolveSupportedLocale('zh-hant-hk')).toBe('zh-HK');
    expect(resolveSupportedLocale('  de-at  ')).toBe('de-DE');
  });

  it('returns the default locale for a language we do not ship', () => {
    expect(resolveSupportedLocale('sw-TZ')).toBe('en-US');
    expect(resolveSupportedLocale('xx-XX')).toBe('en-US');
    expect(resolveSupportedLocale('klingon')).toBe('en-US');
  });
});
