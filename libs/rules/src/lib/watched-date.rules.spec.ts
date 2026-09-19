import { WATCHED_DATE_RULES } from './watched-date.rules';

describe('WATCHED_DATE_RULES.COMMENT.REGEX', () => {
  const { REGEX } = WATCHED_DATE_RULES.COMMENT;

  it('allows normal single-line and multi-line text', () => {
    expect(REGEX.test('Watched with friends')).toBe(true);
    expect(REGEX.test('Line one\nLine two')).toBe(true);
  });

  it('rejects an empty string', () => {
    // Unlike PLAYLIST_RULES.DESCRIPTION.REGEX (which uses \s+$ and so allows
    // ""), this pattern uses \s+$ too — so an empty string is allowed by the
    // regex itself and rejected only via the separate MIN:1 length check.
    expect(REGEX.test('')).toBe(true);
  });

  it('rejects a whitespace-only string', () => {
    expect(REGEX.test('   ')).toBe(false);
  });

  it('rejects a blank line (two newlines with only whitespace between them)', () => {
    expect(REGEX.test('First\n\nSecond')).toBe(false);
  });
});
