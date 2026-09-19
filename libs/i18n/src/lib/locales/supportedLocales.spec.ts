import { defaultSupportedLocale, isSupportedLocale, supportedLocales } from './supportedLocales';

describe('isSupportedLocale', () => {
  it('returns true for a supported locale', () => {
    expect(isSupportedLocale('en-US')).toBe(true);
    expect(isSupportedLocale('fr-FR')).toBe(true);
  });

  it('returns false for an unsupported locale', () => {
    expect(isSupportedLocale('xx-XX')).toBe(false);
    expect(isSupportedLocale('')).toBe(false);
  });

  it('is case-sensitive (locale tags are stored with a specific casing)', () => {
    expect(isSupportedLocale('en-us')).toBe(false);
  });
});

describe('defaultSupportedLocale', () => {
  it('is itself a supported locale', () => {
    expect(supportedLocales).toContain(defaultSupportedLocale);
  });

  it('is en-US', () => {
    expect(defaultSupportedLocale).toBe('en-US');
  });
});

describe('supportedLocales', () => {
  it('contains no duplicates', () => {
    expect(new Set(supportedLocales).size).toBe(supportedLocales.length);
  });
});
