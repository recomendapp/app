import { REVIEW_RULES } from './review.rules';

describe('REVIEW_RULES.TITLE.REGEX', () => {
  // NOTE: same always-matches pattern as PLAYLIST_RULES.TITLE.REGEX and
  // USER_RULES.NAME.REGEX — [a-zA-Z0-9\s\S] covers every character, so this
  // enforces nothing despite looking like an alphanumeric restriction.
  it('matches any string, including symbols/emoji/empty', () => {
    expect(REVIEW_RULES.TITLE.REGEX.test('')).toBe(true);
    expect(REVIEW_RULES.TITLE.REGEX.test('A masterpiece!')).toBe(true);
    expect(REVIEW_RULES.TITLE.REGEX.test('🍿 Loved it — 10/10')).toBe(true);
  });
});
