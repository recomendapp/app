import { describe, it, expect } from 'bun:test';
import { findTranslationIssues, flattenTranslations, messageTokens } from './translationCoverage';

const tokens = (message: string) => {
  const { required, allowed, error } = messageTokens(message);
  return { required: [...required].sort(), allowed: [...allowed].sort(), error };
};

describe('flattenTranslations', () => {
  it('joins nested keys with a dot', () => {
    expect(flattenTranslations({ site: { tagline: 'Hello', meta: { title: 'T' } } })).toEqual({
      'site.tagline': 'Hello',
      'site.meta.title': 'T',
    });
  });

  it('prefixes every key when asked to', () => {
    expect(flattenTranslations({ new: { subject: 'S' } }, 'follow')).toEqual({
      'follow.new.subject': 'S',
    });
  });
});

describe('messageTokens', () => {
  it('requires an interpolated argument', () => {
    expect(tokens('Hello {name}, you have {count} left')).toMatchObject({
      required: ['count', 'name'],
      allowed: ['count', 'name'],
    });
  });

  it('allows but does not require a plural selector', () => {
    expect(tokens('{count, plural, one {# film} other {# films}}')).toMatchObject({
      required: [],
      allowed: ['count'],
    });
  });

  it('does not mistake a single-word plural branch for an argument', () => {
    expect(tokens('{count, plural, one {pick} other {picks}}')).toMatchObject({
      required: [],
      allowed: ['count'],
    });
  });

  it('reads arguments nested inside a branch', () => {
    expect(
      tokens('{count, plural, one {{title} alone} other {{title} and {others}}}'),
    ).toMatchObject({
      required: ['others', 'title'],
      allowed: ['count', 'others', 'title'],
    });
  });

  it('reads through a select nested in a plural', () => {
    expect(
      tokens(
        '{gender, select, female {{count, plural, one {ancienne} other {anciennes}}} other {{count, plural, one {ancien} other {anciens}}}}',
      ),
    ).toMatchObject({ required: [], allowed: ['count', 'gender'] });
  });

  it('requires rich-text tags', () => {
    expect(tokens('Share <strong>{title}</strong> via <email></email>')).toMatchObject({
      required: ['email', 'strong', 'title'],
      allowed: ['email', 'strong', 'title'],
    });
  });

  it('ignores a quoted brace', () => {
    expect(tokens("Use '{'name'}' as a literal")).toMatchObject({ required: [], allowed: [] });
  });

  it('reports unbalanced braces', () => {
    // The shape of the fr-FR 'most_old' bug: one brace too many.
    expect(tokens('{{gender, select, female {ancienne} other {ancien}}').error).toBe(
      'empty argument at 0',
    );
    expect(tokens('{count, plural, one {x} other {y}').error).toBe('unbalanced braces');
    expect(tokens('{count, plural, one {x} other {y}}}').error).toBe('unexpected "}"');
    expect(tokens('Hello {}').error).toBe('empty argument at 6');
    expect(tokens('Hello {name').error).toBe('unterminated argument "name"');
  });
});

describe('findTranslationIssues', () => {
  const reference = {
    'a.greeting': 'Hello {name}',
    'a.count': '{count, plural, one {# film} other {# films}}',
    'a.link': 'Read <link>the docs</link>',
    'a.empty': '',
  };

  it('reports nothing when a locale matches the reference', () => {
    expect(
      findTranslationIssues({
        reference,
        referenceLocale: 'en-US',
        locales: {
          'en-US': reference,
          'de-DE': {
            'a.greeting': 'Hallo {name}',
            'a.count': '{count, plural, one {# Film} other {# Filme}}',
            'a.link': 'Lies <link>die Doku</link>',
            'a.empty': '',
          },
        },
      }),
    ).toEqual([]);
  });

  it('reports a missing key, an unknown key and an empty value', () => {
    const issues = findTranslationIssues({
      reference,
      referenceLocale: 'en-US',
      locales: {
        'de-DE': {
          'a.greeting': '',
          'a.link': 'Lies <link>die Doku</link>',
          'a.empty': '',
          'a.extra': 'Zuviel',
        },
      },
    });

    expect(issues).toEqual([
      'de-DE: 1 missing key(s): a.count',
      'de-DE: 1 key(s) absent from en-US: a.extra',
      'de-DE: 1 empty value(s): a.greeting',
    ]);
  });

  it('reports a lost value, a lost tag and an unknown argument', () => {
    const issues = findTranslationIssues({
      reference,
      referenceLocale: 'en-US',
      locales: {
        'de-DE': {
          'a.greeting': 'Hallo {nme}',
          'a.count': '{count, plural, one {# Film} other {# Filme}}',
          'a.link': 'Lies die Doku',
          'a.empty': '',
        },
      },
    });

    expect(issues).toEqual([
      'de-DE: 2 key(s) with mismatched placeholders: a.greeting (lost name / unexpected nme), a.link (lost link)',
    ]);
  });

  it('lets a locale drop a plural a language does not need', () => {
    expect(
      findTranslationIssues({
        reference,
        referenceLocale: 'en-US',
        locales: {
          'ja-JP': {
            'a.greeting': '{name}さん、こんにちは',
            'a.count': '{count}本',
            'a.link': '<link>ドキュメント</link>を読む',
            'a.empty': '',
          },
        },
      }),
    ).toEqual([]);
  });

  it('accepts an implicit argument the reference locale ignores', () => {
    const locales = {
      'fr-FR': {
        'a.greeting': 'Bonjour {name}',
        'a.count': '{count, plural, one {# film} other {# films}}',
        'a.link': 'Lis <link>la doc</link>',
        'a.empty': '{gender, select, female {vue} other {vu}}',
      },
    };

    expect(findTranslationIssues({ reference, referenceLocale: 'en-US', locales })).toEqual([
      'fr-FR: 1 key(s) with mismatched placeholders: a.empty (unexpected gender)',
    ]);

    expect(
      findTranslationIssues({
        reference,
        referenceLocale: 'en-US',
        locales,
        implicitArguments: ['gender'],
      }),
    ).toEqual([]);
  });

  it('reports an invalid ICU message, including in the reference locale', () => {
    expect(
      findTranslationIssues({
        reference: { 'a.broken': '{count, plural, one {x} other {y}' },
        referenceLocale: 'en-US',
        locales: { 'en-US': { 'a.broken': '{count, plural, one {x} other {y}' } },
      }),
    ).toEqual(['en-US: 1 invalid ICU message(s): a.broken (unbalanced braces)']);
  });
});
