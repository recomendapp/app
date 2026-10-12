import { describe, it, expect } from 'bun:test';
import { parseVersionName } from './google-play.service';

describe('parseVersionName', () => {
  it('reads a release named after the version itself', () => {
    expect(parseVersionName('1.7.0')).toBe('1.7.0');
    expect(parseVersionName('1.6.0')).toBe('1.6.0');
    expect(parseVersionName('v1.7.0')).toBe('1.7.0');
    expect(parseVersionName('  1.7.0  ')).toBe('1.7.0');
  });

  // Play's own default naming: the leading number is a build counter, not a version.
  it('prefers the parenthesized version over the leading version code', () => {
    expect(parseVersionName('77 (1.5.1)')).toBe('1.5.1');
    expect(parseVersionName('123 (2.0)')).toBe('2.0');
  });

  it('never mistakes a bare version code for a version', () => {
    expect(parseVersionName('77')).toBeNull();
    expect(parseVersionName('79')).toBeNull();
  });

  it('ignores a name it cannot parse rather than guessing', () => {
    expect(parseVersionName(undefined)).toBeNull();
    expect(parseVersionName('')).toBeNull();
    expect(parseVersionName('Hotfix (urgent)')).toBeNull();
    expect(parseVersionName('summer release')).toBeNull();
    expect(parseVersionName('1.7.0-beta.1')).toBeNull();
  });
});
