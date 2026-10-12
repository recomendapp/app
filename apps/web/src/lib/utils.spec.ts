import { describe, it, expect, afterEach } from 'bun:test';
import { getURL } from './utils';

describe('getURL', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  const withEnv = (env: Record<string, string | undefined>) => {
    process.env = { ...original, ...env } as NodeJS.ProcessEnv;
    return getURL();
  };

  it('returns the configured site URL without a trailing slash', () => {
    expect(withEnv({ NEXT_PUBLIC_SITE_URL: 'https://recomend.app' })).toBe('https://recomend.app');
    expect(withEnv({ NEXT_PUBLIC_SITE_URL: 'https://recomend.app/' })).toBe('https://recomend.app');
  });

  it('adds the scheme to a bare hostname', () => {
    expect(withEnv({ NEXT_PUBLIC_SITE_URL: 'recomend.app' })).toBe('https://recomend.app');
  });

  // The regression: CI writes the variable unconditionally, so a missing secret arrives
  // as "", which `??` let through -- and the old string-patching turned it into
  // "https:/", shipping "https://sitemaps/index.xml.gz" in robots.txt.
  it('falls back instead of building a hostless URL from an empty variable', () => {
    expect(withEnv({ NEXT_PUBLIC_SITE_URL: '', NODE_ENV: 'production' })).toBe(
      'https://recomend.app',
    );
    expect(withEnv({ NEXT_PUBLIC_SITE_URL: '   ', NODE_ENV: 'production' })).toBe(
      'https://recomend.app',
    );
  });

  it('never returns a URL without a hostname, whatever it is handed', () => {
    for (const value of ['https://', 'http://', '/', '://', 'https:/', ' ']) {
      const result = withEnv({ NEXT_PUBLIC_SITE_URL: value, NODE_ENV: 'production' });
      expect(new URL(result).hostname).not.toBe('');
    }
  });

  // What the bug actually produced, asserted end to end.
  it('builds a sitemap URL Google can resolve even with no variable set', () => {
    const sitemap = `${withEnv({ NEXT_PUBLIC_SITE_URL: '', NODE_ENV: 'production' })}/sitemaps/index.xml.gz`;
    expect(sitemap).toBe('https://recomend.app/sitemaps/index.xml.gz');
    expect(new URL(sitemap).hostname).toBe('recomend.app');
  });

  it('falls back to the Vercel URL when the site URL is unset', () => {
    expect(
      withEnv({ NEXT_PUBLIC_SITE_URL: undefined, NEXT_PUBLIC_VERCEL_URL: 'preview.vercel.app' }),
    ).toBe('https://preview.vercel.app');
  });

  it('uses localhost outside production', () => {
    expect(
      withEnv({
        NEXT_PUBLIC_SITE_URL: undefined,
        NEXT_PUBLIC_VERCEL_URL: undefined,
        NODE_ENV: 'development',
      }),
    ).toBe('http://localhost:3000');
  });
});
