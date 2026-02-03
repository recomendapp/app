import { siteConfig } from "@/config/site";
import { buildSitemapIndex } from "@/lib/sitemap";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sitemapIndexes = [
      `${siteConfig.url}/sitemaps/films.xml`,
      `${siteConfig.url}/sitemaps/tv-series.xml`,
      `${siteConfig.url}/sitemaps/reviews.xml`,
      `${siteConfig.url}/sitemaps/playlists.xml`,
      `${siteConfig.url}/sitemaps/users.xml`,
      `${siteConfig.url}/sitemaps/statics.xml`,
    ]
    const sitemapIndexXML = buildSitemapIndex(sitemapIndexes);
    return new NextResponse(sitemapIndexXML, {
      headers: {
        "Content-Type": "application/xml",
        "Content-Length": Buffer.byteLength(sitemapIndexXML).toString(),
      },
    });
  } catch (error) {
    console.error('Error generating sitemap index:', error);
    return NextResponse.error();
  }
}