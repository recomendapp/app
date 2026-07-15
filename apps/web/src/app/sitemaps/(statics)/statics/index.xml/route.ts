import { siteConfig } from '@/config/site';
import { sitemapLocales } from '@/lib/i18n/routing';
import { buildSitemap } from '@/lib/sitemap';
import { NextResponse } from 'next/server';
import type { MetadataRoute } from 'next';

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

function buildStaticEntries(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString().split('T')[0];

  return STATIC_ENTRIES.map((entry) => ({
    url: `${siteConfig.url}${entry.path}`,
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
    alternates: {
      languages: sitemapLocales(entry.path),
    },
  }));
}

export async function GET() {
  try {
    const xml = buildSitemap(buildStaticEntries());
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
