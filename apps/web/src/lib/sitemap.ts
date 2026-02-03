import { MetadataRoute } from "next";

export const buildSitemapIndex = (sitemaps: string[]): string => {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

  for (const sitemapURL of sitemaps) {
    xml += "<sitemap>";
    xml += `<loc>${sitemapURL}</loc>`;
    xml += "</sitemap>";
  }

  xml += "</sitemapindex>";
  return xml;
}

export const buildSitemap = (
	urls: MetadataRoute.Sitemap
): string => {
	let xml = '<?xml version="1.0" encoding="UTF-8"?>';
	xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

	for (const url of urls) {
		xml += "<url>";
		xml += `<loc>${url.url}</loc>`;
		if (url.lastModified) {
			xml += `<lastmod>${new Date(url.lastModified).toISOString()}</lastmod>`;
		}
		if (url.changeFrequency) {
			xml += `<changefreq>${url.changeFrequency}</changefreq>`;
		}
		if (url.priority) {
			xml += `<priority>${url.priority}</priority>`;
		}
		if (url.alternates) {
			if (url.alternates.languages) {
				for (const [lang, loc] of Object.entries(url.alternates.languages)) {
					xml += `<xhtml:link rel="alternate" hreflang="${lang}" href="${loc}" />`;
				}
			}
		}
		xml += "</url>";
	}

	xml += "</urlset>";
	return xml;
}