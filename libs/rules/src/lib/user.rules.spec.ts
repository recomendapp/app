import { USER_RULES } from './user.rules';

describe('USER_RULES.USERNAME.REGEX', () => {
  const { REGEX } = USER_RULES.USERNAME;

  it('accepts simple valid usernames within the 3-15 length range', () => {
    expect(REGEX.test('abc')).toBe(true); // 3 chars, MIN
    expect(REGEX.test('a'.repeat(15))).toBe(true); // 15 chars, MAX
    expect(REGEX.test('john_doe')).toBe(true);
    expect(REGEX.test('john.doe')).toBe(true);
    expect(REGEX.test('user123')).toBe(true);
  });

  it('rejects usernames shorter than 3 characters', () => {
    expect(REGEX.test('')).toBe(false);
    expect(REGEX.test('a')).toBe(false);
    expect(REGEX.test('ab')).toBe(false);
  });

  it('rejects usernames longer than 15 characters', () => {
    expect(REGEX.test('a'.repeat(16))).toBe(false);
  });

  it('allows a leading underscore or digit', () => {
    expect(REGEX.test('_username')).toBe(true);
    expect(REGEX.test('1username')).toBe(true);
  });

  it('rejects a leading dot', () => {
    expect(REGEX.test('.username')).toBe(false);
  });

  it('rejects a trailing dot', () => {
    expect(REGEX.test('username.')).toBe(false);
  });

  it('rejects consecutive dots anywhere in the username', () => {
    expect(REGEX.test('user..name')).toBe(false);
    expect(REGEX.test('us..ername')).toBe(false);
  });

  it('rejects whitespace and most punctuation', () => {
    expect(REGEX.test('user name')).toBe(false);
    expect(REGEX.test('user-name')).toBe(false);
    expect(REGEX.test('user@name')).toBe(false);
  });

  it('rejects non-ASCII characters', () => {
    expect(REGEX.test('émilie')).toBe(false);
    expect(REGEX.test('用户名test')).toBe(false);
  });
});

describe('USER_RULES.USERNAME.normalization', () => {
  const { normalization } = USER_RULES.USERNAME;

  it('trims surrounding whitespace and lowercases', () => {
    expect(normalization('  JohnDoe  ')).toBe('johndoe');
  });

  it('is idempotent on an already-normalized username', () => {
    expect(normalization('john_doe')).toBe('john_doe');
  });
});

describe('USER_RULES.NAME.REGEX', () => {
  // NOTE: same always-matches pattern as PLAYLIST_RULES.TITLE.REGEX/REVIEW_RULES.TITLE.REGEX.
  it('matches any string, including symbols/emoji/empty', () => {
    expect(USER_RULES.NAME.REGEX.test('')).toBe(true);
    expect(USER_RULES.NAME.REGEX.test('Jean-Paul Sartre')).toBe(true);
    expect(USER_RULES.NAME.REGEX.test('François 🎬')).toBe(true);
  });
});

describe('USER_RULES.BIO.REGEX', () => {
  const { REGEX } = USER_RULES.BIO;

  it('allows normal single-line text', () => {
    expect(REGEX.test('Movie lover, dad of 2.')).toBe(true);
  });

  it('allows multi-line text (regression: previously rejected any bio containing a newline)', () => {
    expect(REGEX.test('Movie lover\nDad of 2')).toBe(true);
    expect(REGEX.test('Line one\nLine two\nLine three')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(REGEX.test('')).toBe(false);
  });

  it('rejects a whitespace-only string', () => {
    expect(REGEX.test('   ')).toBe(false);
    expect(REGEX.test('\n\t ')).toBe(false);
  });

  it('rejects a blank line (two newlines with only whitespace between them)', () => {
    expect(REGEX.test('Paragraph one\n\nParagraph two')).toBe(false);
  });

  it('rejects text longer than 150 characters', () => {
    expect(REGEX.test('a'.repeat(150))).toBe(true);
    expect(REGEX.test('a'.repeat(151))).toBe(false);
  });
});
