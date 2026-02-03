import { siteConfig } from "@/config/site";
import { buildSitemapIndex } from "@/lib/sitemap";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sitemapIndexes = [
      `${siteConfig.url}/sitemaps/statics/sitemap.xml`,
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