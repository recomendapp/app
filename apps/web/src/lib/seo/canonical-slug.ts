import type { SupportedLocale } from '@libs/i18n';
import { permanentRedirect } from '@/lib/i18n/navigation';

/**
 * Sends a request to the canonical slug when it arrived at another one.
 *
 * Slugs here are cosmetic: only the leading id is parsed, so `/film/550-anything` serves
 * the same page as `/film/550-fight-club`, and every entity is reachable at unlimited
 * URLs. A canonical tag asks Google to consolidate them, but it has to crawl each one to
 * read the tag -- and crawl budget is this site's actual bottleneck. A permanent redirect
 * settles it in one hop instead.
 *
 * Permanent (308) rather than the default temporary redirect: a temporary one leaves the
 * wrong URL in the index as a separate page, which is the problem being solved.
 *
 * Nothing happens when the entity has no slug of its own -- there is no better URL to
 * send the request to.
 */
export function enforceCanonicalSlug({
  locale,
  requested,
  canonical,
  href,
}: {
  locale: SupportedLocale;
  /** The slug segment as it came in from the URL. */
  requested: string;
  /** The slug the API reports for this entity, in this locale. */
  canonical: string | null | undefined;
  /** Where to send the request, slug included -- sub-paths differ per page. */
  href: string;
}): void {
  if (!canonical || requested === canonical) return;
  permanentRedirect({ href, locale });
}
