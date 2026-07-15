import { siteConfig } from '@/config/site';
import { sitemapLocales } from '@/lib/i18n/routing';
import { NextResponse } from 'next/server';

type StaticEntry = {
  path: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
};

const STATIC_ENTRIES: StaticEntry[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/explore', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/upgrade', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/legal/terms-of-use', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/legal/privacy-policy', changeFrequency: 'monthly', priority: 0.5 },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildStaticSitemap(): string {
  const lastMod = new Date().toISOString();

  const urls = STATIC_ENTRIES.map((entry) => {
    const loc = `${siteConfig.url}${entry.path}`;
    const languages = sitemapLocales(entry.path);

    const alternates = Object.entries(languages)
      .map(
        ([hreflang, href]) =>
          `<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}"/>`,
      )
      .join('');

    return (
      `<url>` +
      `<loc>${escapeXml(loc)}</loc>` +
      `<lastmod>${lastMod}</lastmod>` +
      `<changefreq>${entry.changeFrequency}</changefreq>` +
      `<priority>${entry.priority}</priority>` +
      alternates +
      `</url>`
    );
  }).join('');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">` +
    urls +
    `</urlset>`
  );
}

export async function GET() {
  try {
    const xml = buildStaticSitemap();
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': Buffer.byteLength(xml).toString(),
        'Cache-Control': 'public, max-age=3600, s-maxage=14400',
      },
    });
  } catch (error) {
    console.error('Error generating statics sitemap:', error);
    return NextResponse.error();
  }
}
