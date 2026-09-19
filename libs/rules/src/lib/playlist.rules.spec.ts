import { PLAYLIST_RULES } from './playlist.rules';

describe('PLAYLIST_RULES.TITLE.REGEX', () => {
  // NOTE: [a-zA-Z0-9\s\S] is every character class ORed with its own complement,
  // so this pattern matches literally any string (including empty). It reads like
  // an alphanumeric-only restriction but enforces nothing — documenting the
  // current (permissive) behavior here so a future tightening is a deliberate,
  // visible change rather than a silent one.
  it('matches any string, including symbols/emoji/empty', () => {
    expect(PLAYLIST_RULES.TITLE.REGEX.test('')).toBe(true);
    expect(PLAYLIST_RULES.TITLE.REGEX.test('My Playlist')).toBe(true);
    expect(PLAYLIST_RULES.TITLE.REGEX.test('🎬 Best of 2024 — été!')).toBe(true);
    expect(PLAYLIST_RULES.TITLE.REGEX.test('<script>alert(1)</script>')).toBe(true);
  });
});

describe('PLAYLIST_RULES.DESCRIPTION.REGEX', () => {
  const { REGEX } = PLAYLIST_RULES.DESCRIPTION;

  it('allows normal single-line and multi-line text', () => {
    expect(REGEX.test('A great playlist')).toBe(true);
    expect(REGEX.test('Line one\nLine two')).toBe(true);
  });

  it('allows leading/trailing padding around real content', () => {
    expect(REGEX.test('  padded text  ')).toBe(true);
  });

  it('allows an empty string (length is enforced separately via MIN)', () => {
    expect(REGEX.test('')).toBe(true);
  });

  it('rejects a whitespace-only string', () => {
    expect(REGEX.test('   ')).toBe(false);
    expect(REGEX.test('\n\t ')).toBe(false);
  });

  it('rejects a blank line (two newlines with only whitespace between them)', () => {
    expect(REGEX.test('Paragraph one\n\nParagraph two')).toBe(false);
    expect(REGEX.test('Paragraph one\n   \nParagraph two')).toBe(false);
  });

  it('allows consecutive non-blank lines', () => {
    expect(REGEX.test('Paragraph one\nParagraph two\nParagraph three')).toBe(true);
  });
});
