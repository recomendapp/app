export type TranslationTree = { [key: string]: string | TranslationTree };

/**
 * Flatten a translation file into dotted keys
 *
 * @example
 * ```ts
 * flattenTranslations({ site: { tagline: 'Hello' } }); // { 'site.tagline': 'Hello' }
 * ```
 */
export const flattenTranslations = (tree: TranslationTree, prefix = ''): Record<string, string> => {
  const flat: Record<string, string> = {};

  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      flat[path] = value;
    } else {
      Object.assign(flat, flattenTranslations(value, path));
    }
  }

  return flat;
};

const TAG = /<\/?\s*([A-Za-z_]\w*)\s*>/g;
const IDENTIFIER = /\w/;

export type MessageTokens = {
  /** Values and tags a translation has to keep, or the UI loses one of them. */
  required: Set<string>;
  /** Everything the message may name, plural and select selectors included. */
  allowed: Set<string>;
  /** Set when the message is not valid ICU (unbalanced or empty braces). */
  error?: string;
};

/**
 * Collect the ICU arguments and the rich-text tags a message depends on
 *
 * A regex cannot do this: in `{count, plural, one {pick} other {picks}}` the
 * braces around `pick` delimit a branch, so `pick` is text, not an argument.
 * This walks the message instead, tracking whether a brace opens an argument
 * (message context) or a branch (argument context).
 *
 * Selectors land in `allowed` but not in `required`: a language with a single
 * plural category has nothing to branch on and may drop the whole plural.
 *
 * @param message - The ICU message to read
 * @returns The tokens the message uses, or an `error` when it cannot be parsed
 * @category i18n
 * @module messageTokens
 */
export const messageTokens = (message: string): MessageTokens => {
  const required = new Set<string>();
  const allowed = new Set<string>();
  const stack: ('message' | 'argument')[] = ['message'];

  let index = 0;

  const fail = (error: string): MessageTokens => ({ required, allowed, error });

  while (index < message.length) {
    const char = message[index]!;

    // ICU quoting: '' is a literal apostrophe, '{ '} '# quote until the next one.
    if (char === "'") {
      const next = message[index + 1];
      if (next === "'") {
        index += 2;
      } else if (next === '{' || next === '}' || next === '#') {
        const end = message.indexOf("'", index + 2);
        index = end === -1 ? message.length : end + 1;
      } else {
        index += 1;
      }
      continue;
    }

    if (char === '}') {
      if (stack.length <= 1) return fail('unexpected "}"');
      stack.pop();
      index += 1;
      continue;
    }

    if (char !== '{') {
      index += 1;
      continue;
    }

    // Inside an argument, a brace opens one of its branches, which is a message.
    if (stack[stack.length - 1] === 'argument') {
      stack.push('message');
      index += 1;
      continue;
    }

    let cursor = index + 1;
    while (message[cursor] === ' ') cursor += 1;

    let name = '';
    while (cursor < message.length && IDENTIFIER.test(message[cursor]!)) {
      name += message[cursor];
      cursor += 1;
    }
    while (message[cursor] === ' ') cursor += 1;

    if (!name) return fail(`empty argument at ${index}`);

    if (message[cursor] === '}') {
      allowed.add(name);
      required.add(name);
      index = cursor + 1;
      continue;
    }

    if (message[cursor] === ',') {
      allowed.add(name);
      stack.push('argument');
      index = cursor + 1;
      continue;
    }

    return fail(`unterminated argument "${name}"`);
  }

  if (stack.length !== 1) return fail('unbalanced braces');

  for (const [, name] of message.matchAll(TAG)) {
    allowed.add(name!);
    required.add(name!);
  }

  return { required, allowed };
};

const summarize = (keys: string[], limit = 5): string =>
  keys.length <= limit
    ? keys.join(', ')
    : `${keys.slice(0, limit).join(', ')} (+${keys.length - limit} more)`;

/**
 * Compare every locale against the reference locale and describe what is off
 *
 * Returns one line per locale and per kind of problem, so a failing assertion
 * reads as a to-do list in the CI log. An empty array means the locales are
 * interchangeable with the reference one.
 *
 * @param reference - The flattened reference translations (en-US)
 * @param referenceLocale - The locale `reference` comes from, skipped while comparing
 * @param locales - The flattened translations to compare, keyed by locale
 * @param implicitArguments - Arguments call sites always pass, so a locale may
 *   branch on them on a key the reference locale keeps as plain text
 * @returns A human-readable list of problems, empty when everything matches
 * @category i18n
 * @module findTranslationIssues
 */
export const findTranslationIssues = ({
  reference,
  referenceLocale,
  locales,
  implicitArguments = [],
}: {
  reference: Record<string, string>;
  referenceLocale: string;
  locales: Record<string, Record<string, string>>;
  implicitArguments?: string[];
}): string[] => {
  const issues: string[] = [];
  const referenceKeys = Object.keys(reference);

  for (const [locale, messages] of Object.entries(locales)) {
    const missing = referenceKeys.filter((key) => !(key in messages));
    const unknown = Object.keys(messages).filter((key) => !(key in reference));
    const untranslated: string[] = [];
    const invalid: string[] = [];
    const broken: string[] = [];

    for (const key of referenceKeys) {
      const translation = messages[key];
      if (translation === undefined) continue;

      const expected = messageTokens(reference[key]!);
      const actual = messageTokens(translation);

      if (actual.error) {
        invalid.push(`${key} (${actual.error})`);
        continue;
      }

      if (locale === referenceLocale) continue;

      if (reference[key]!.trim() !== '' && translation.trim() === '') {
        untranslated.push(key);
        continue;
      }

      const lost = [...expected.required].filter((token) => !actual.allowed.has(token));
      const extra = [...actual.allowed].filter(
        (token) => !expected.allowed.has(token) && !implicitArguments.includes(token),
      );

      if (lost.length || extra.length) {
        const details = [
          lost.length ? `lost ${lost.join(', ')}` : '',
          extra.length ? `unexpected ${extra.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join(' / ');
        broken.push(`${key} (${details})`);
      }
    }

    if (missing.length) {
      issues.push(`${locale}: ${missing.length} missing key(s): ${summarize(missing)}`);
    }
    if (unknown.length) {
      issues.push(
        `${locale}: ${unknown.length} key(s) absent from ${referenceLocale}: ${summarize(unknown)}`,
      );
    }
    if (untranslated.length) {
      issues.push(`${locale}: ${untranslated.length} empty value(s): ${summarize(untranslated)}`);
    }
    if (invalid.length) {
      issues.push(`${locale}: ${invalid.length} invalid ICU message(s): ${summarize(invalid, 3)}`);
    }
    if (broken.length) {
      issues.push(
        `${locale}: ${broken.length} key(s) with mismatched placeholders: ${summarize(broken, 3)}`,
      );
    }
  }

  return issues;
};
