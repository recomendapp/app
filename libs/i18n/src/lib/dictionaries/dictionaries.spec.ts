import { describe, it, expect } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  defaultSupportedLocale,
  flattenTranslations,
  findTranslationIssues,
  messageTokens,
  supportedLocales,
  type TranslationTree,
} from '../i18n';

const DICTIONARIES_DIR = import.meta.dir;

const read = (locale: string): Record<string, string> =>
  flattenTranslations(
    JSON.parse(readFileSync(join(DICTIONARIES_DIR, `${locale}.json`), 'utf-8')) as TranslationTree,
  );

const dictionaries = Object.fromEntries(
  supportedLocales.map((locale) => [locale, read(locale)] as const),
);

const reference = dictionaries[defaultSupportedLocale]!;

/**
 * Arguments a translation may use even though en-US ignores them: fr-FR is
 * written by hand next to en-US and branches on what the call sites pass
 * anyway. Anything outside this set is a typo in a translation.
 */
const implicitArguments = [
  ...new Set(
    Object.entries(dictionaries['fr-FR']!).flatMap(([key, message]) => {
      const expected = messageTokens(reference[key] ?? '').allowed;
      return [...messageTokens(message).allowed].filter((token) => !expected.has(token));
    }),
  ),
].sort();

describe('dictionaries (libs/i18n)', () => {
  it('ships one dictionary per supported locale, and nothing else', () => {
    const shipped = readdirSync(DICTIONARIES_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace(/\.json$/, ''))
      .sort();

    expect(shipped).toEqual([...supportedLocales].sort());
  });

  it('only lets fr-FR add the arguments the call sites pass on top of en-US', () => {
    expect(implicitArguments).toEqual(['count', 'date', 'gender']);
  });

  it('has the same keys, placeholders and tags as the reference locale in every locale', () => {
    const issues = findTranslationIssues({
      reference,
      referenceLocale: defaultSupportedLocale,
      locales: dictionaries,
      implicitArguments,
    });

    expect(issues).toEqual([]);
  });

  it('only branches on gender in the French dictionaries', () => {
    // The gender argument is hard-coded per call site from the French noun's
    // gender, so any other locale would pick its branch from French grammar.
    const branching = supportedLocales.filter((locale) =>
      Object.values(dictionaries[locale]!).some((message) => message.includes('gender, select')),
    );

    expect(branching.sort()).toEqual(['fr-CA', 'fr-FR']);
  });
});
