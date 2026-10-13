import { describe, it, expect } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  defaultSupportedLocale,
  findTranslationIssues,
  flattenTranslations,
  supportedLocales,
  type TranslationTree,
} from '@libs/i18n';

const I18N_DIR = join(import.meta.dir, 'assets/i18n');

const filesOf = (locale: string) => readdirSync(join(I18N_DIR, locale)).sort();

/** Flattened with the file name as prefix, so a missing file reads as missing keys. */
const read = (locale: string): Record<string, string> =>
  Object.assign(
    {},
    ...filesOf(locale).map((file) =>
      flattenTranslations(
        JSON.parse(readFileSync(join(I18N_DIR, locale, file), 'utf-8')) as TranslationTree,
        file.replace(/\.json$/, ''),
      ),
    ),
  );

const translations = Object.fromEntries(
  supportedLocales.map((locale) => [locale, read(locale)] as const),
);

describe('api translations (assets/i18n)', () => {
  it('ships one directory per supported locale, and nothing else', () => {
    expect(readdirSync(I18N_DIR).sort()).toEqual([...supportedLocales].sort());
  });

  it('ships the same files in every locale', () => {
    const expected = filesOf(defaultSupportedLocale);

    for (const locale of supportedLocales) {
      expect(filesOf(locale)).toEqual(expected);
    }
  });

  it('has the same keys and placeholders as the reference locale in every locale', () => {
    const issues = findTranslationIssues({
      reference: translations[defaultSupportedLocale]!,
      referenceLocale: defaultSupportedLocale,
      locales: translations,
    });

    expect(issues).toEqual([]);
  });
});
