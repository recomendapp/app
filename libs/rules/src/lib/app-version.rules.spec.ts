import { describe, it, expect } from 'bun:test';
import {
  compareAppVersions,
  evaluateAppVersionStatus,
  readAppVersionHeaders,
  APP_PLATFORM_HEADER,
  APP_VERSION_HEADER,
} from './app-version.rules';

describe('compareAppVersions', () => {
  it.each([
    ['1.0.0', '1.0.0', 0],
    ['1.2.0', '1.10.0', -1],
    ['2.0.0', '1.99.99', 1],
    ['1.2', '1.2.0', 0],
    ['1.2.1', '1.2', 1],
  ])('compares %s with %s', (a, b, expected) => {
    expect(compareAppVersions(a, b)).toBe(expected);
  });
});

describe('evaluateAppVersionStatus', () => {
  const policy = { minVersion: '1.2.0', latestVersion: '1.4.0' };

  it('requires an update below minVersion', () => {
    expect(evaluateAppVersionStatus('1.1.9', policy)).toBe('update_required');
  });

  it('offers an update between minVersion and latestVersion', () => {
    expect(evaluateAppVersionStatus('1.2.0', policy)).toBe('update_available');
  });

  it('is up to date at latestVersion', () => {
    expect(evaluateAppVersionStatus('1.4.0', policy)).toBe('up_to_date');
  });

  it('is up to date past latestVersion', () => {
    expect(evaluateAppVersionStatus('2.0.0', policy)).toBe('up_to_date');
  });

  it('never blocks an unparseable client version', () => {
    expect(evaluateAppVersionStatus('garbage', policy)).toBe('up_to_date');
  });

  it('ignores a malformed minVersion in the policy', () => {
    expect(evaluateAppVersionStatus('0.0.1', { minVersion: 'v2', latestVersion: null })).toBe(
      'up_to_date',
    );
  });

  it('is up to date when no policy is configured', () => {
    expect(evaluateAppVersionStatus('0.0.1', { minVersion: null, latestVersion: null })).toBe(
      'up_to_date',
    );
  });
});

describe('readAppVersionHeaders', () => {
  it('reads valid platform and version headers', () => {
    expect(
      readAppVersionHeaders({
        [APP_PLATFORM_HEADER]: 'ios',
        [APP_VERSION_HEADER]: '1.6.0',
      }),
    ).toEqual({ platform: 'ios', version: '1.6.0' });
  });

  it('accepts the web platform too', () => {
    expect(
      readAppVersionHeaders({
        [APP_PLATFORM_HEADER]: 'web',
        [APP_VERSION_HEADER]: '2.1.0',
      }),
    ).toEqual({ platform: 'web', version: '2.1.0' });
  });

  it('takes the first value when a header is duplicated', () => {
    expect(
      readAppVersionHeaders({
        [APP_PLATFORM_HEADER]: ['android', 'ios'],
        [APP_VERSION_HEADER]: '1.6.0',
      }),
    ).toEqual({ platform: 'android', version: '1.6.0' });
  });

  it('returns null when headers are missing', () => {
    expect(readAppVersionHeaders({})).toBeNull();
  });

  it('returns null for an unknown platform', () => {
    expect(
      readAppVersionHeaders({
        [APP_PLATFORM_HEADER]: 'desktop',
        [APP_VERSION_HEADER]: '1.6.0',
      }),
    ).toBeNull();
  });
});
