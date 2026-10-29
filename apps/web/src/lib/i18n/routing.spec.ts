import { describe, it, expect } from 'bun:test';
import { siteConfig } from '@/config/site';
import { supportedLocales } from '@libs/i18n';
import {
  generateLocalizedAlternates,
  generateStaticAlternates,
  localeUrl,
  sitemapLocales,
} from './routing';

const origin = siteConfig.url;

describe('localeUrl', () => {
  it('serves the default locale unprefixed', () => {
    expect(localeUrl('en-US', '/explore')).toBe(`${origin}/explore`);
  });

  it('prefixes every other locale', () => {
    expect(localeUrl('fr-FR', '/explore')).toBe(`${origin}/fr-FR/explore`);
  });

  it('accepts an endpoint with no leading slash', () => {
    expect(localeUrl('fr-FR', 'explore')).toBe(`${origin}/fr-FR/explore`);
  });

  // `/fr-FR/` 308s to `/fr-FR`, which is what made the home page report as canonicalised:
  // the canonical named a URL the site redirects away from.
  it('leaves no trailing slash on a prefixed home page', () => {
    expect(localeUrl('fr-FR', '/')).toBe(`${origin}/fr-FR`);
  });

  it('keeps the slash on the unprefixed root, the one URL served with it', () => {
    expect(localeUrl('en-US', '/')).toBe(`${origin}/`);
  });
});

describe('home page annotations', () => {
  it('canonicalises a prefixed home page to the URL it is served at', () => {
    expect(generateLocalizedAlternates('fr-FR', '/').canonical).toBe(`${origin}/fr-FR`);
  });

  it('builds a sitemap hreflang set with no redirecting URL in it', () => {
    const languages = sitemapLocales('/') as Record<string, string>;

    expect(languages['fr-FR']).toBe(`${origin}/fr-FR`);
    expect(languages['en-US']).toBe(`${origin}/`);
    expect(languages['x-default']).toBe(`${origin}/`);
    expect(
      Object.values(languages).filter((url) => url !== `${origin}/` && url.endsWith('/')),
    ).toEqual([]);
  });
});

describe('generateStaticAlternates', () => {
  it('gives a UI page a canonical of its own and the full hreflang cluster', () => {
    const { canonical, languages } = generateStaticAlternates('fr-FR', '/about');

    expect(canonical).toBe(`${origin}/fr-FR/about`);
    expect(Object.keys(languages as Record<string, string>)).toHaveLength(
      supportedLocales.length + 1,
    );
    expect((languages as Record<string, string>)['en-US']).toBe(`${origin}/about`);
    expect((languages as Record<string, string>)['x-default']).toBe(`${origin}/about`);
  });

  it('annotates the home with the prefixed URLs the site actually serves', () => {
    const { canonical, languages } = generateStaticAlternates('zh-TW', '/');

    expect(canonical).toBe(`${origin}/zh-TW`);
    expect((languages as Record<string, string>)['fr-FR']).toBe(`${origin}/fr-FR`);
  });

  // The statics sitemap claims these same alternates. Two sources disagreeing about one
  // URL's cluster is how an hreflang set gets discarded.
  it('advertises exactly what the statics sitemap advertises', () => {
    expect(generateStaticAlternates('fr-FR', '/explore').languages).toEqual(
      sitemapLocales('/explore'),
    );
  });
});
