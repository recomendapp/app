import { getLocaleFromHeaders } from './getLocaleFromHeaders';
import { HEADER_LANGUAGE_KEY } from '../locales';

describe('getLocaleFromHeaders', () => {
  it('returns the default locale when headers is null/undefined', () => {
    expect(getLocaleFromHeaders(null)).toBe('en-US');
    expect(getLocaleFromHeaders(undefined)).toBe('en-US');
  });

  it('prefers the x-language header over accept-language, for a plain object', () => {
    const result = getLocaleFromHeaders({
      [HEADER_LANGUAGE_KEY]: 'fr-FR',
      'accept-language': 'en-US',
    });
    expect(result).toBe('fr-FR');
  });

  it('supports a Headers-like object with a .get() method', () => {
    const headers = { get: (key: string) => (key === HEADER_LANGUAGE_KEY ? 'fr-FR' : null) };
    expect(getLocaleFromHeaders(headers)).toBe('fr-FR');
  });

  it('falls back to accept-language when x-language is absent', () => {
    expect(getLocaleFromHeaders({ 'accept-language': 'fr-FR' })).toBe('fr-FR');
  });

  it('takes only the first (highest-priority) locale from a multi-value accept-language header', () => {
    expect(getLocaleFromHeaders({ 'accept-language': 'fr-FR,en-US;q=0.8' })).toBe('fr-FR');
  });

  it('strips a quality value attached to the first accept-language entry (regression)', () => {
    // Some clients attach ;q= to every entry, including the first/highest-priority one.
    expect(getLocaleFromHeaders({ 'accept-language': 'fr-FR;q=0.9, en-US;q=0.8' })).toBe('fr-FR');
  });

  it('trims incidental whitespace around the first accept-language entry', () => {
    expect(getLocaleFromHeaders({ 'accept-language': ' fr-FR , en-US' })).toBe('fr-FR');
  });

  it("is case-insensitive on the header key for plain objects (regression: previously only re-lowercased the already-lowercase lookup key, never checked the object's actual key casing)", () => {
    expect(getLocaleFromHeaders({ 'X-Language': 'fr-FR' })).toBe('fr-FR');
    expect(getLocaleFromHeaders({ 'Accept-Language': 'fr-FR' })).toBe('fr-FR');
  });

  it('falls back to the default locale for an unsupported locale', () => {
    expect(getLocaleFromHeaders({ [HEADER_LANGUAGE_KEY]: 'xx-XX' })).toBe('en-US');
  });

  it('falls back to the default locale when no relevant header is present', () => {
    expect(getLocaleFromHeaders({})).toBe('en-US');
  });
});
