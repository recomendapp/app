import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitiales = (name: string | undefined | null) => {
  if (!name) return null;
  const words = name.normalize('NFKC').toUpperCase().split(' ');
  let initials = '';
  if (words.length === 1) {
    initials = words[0].charAt(0);
  } else if (words.length >= 2) {
    for (let i = 0; i < 2; i++) {
      initials += words[i].charAt(0);
    }
  }
  return initials;
};

export function ConvertHoursMinutes(runtime: number | null | undefined) {
  if (!runtime) return 'N/A';
  const heures = Math.floor(runtime / 60);
  const minutes = runtime % 60;
  const minutesFormat = minutes < 10 ? `0${minutes}` : minutes;

  return `${heures}h${minutesFormat}`;
}

export function convertDate(date: string) {
  const parts = date.split('-');
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  return `${day}/${month}/${year}`;
}

export function toISO8601Duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h > 0 ? `${h}H` : ''}${m > 0 ? `${m}M` : ''}`;
}

const PRODUCTION_URL = 'https://recomend.app';
const DEVELOPMENT_URL = 'http://localhost:3000';

/**
 * The site's own origin, never with a trailing slash.
 *
 * `||`, not `??`: the deploy pipeline writes NEXT_PUBLIC_SITE_URL unconditionally, so a
 * secret that doesn't exist arrives as an empty string -- which `??` passes straight
 * through, since it only catches null/undefined. The old version then prefixed it into
 * `https://` and stripped that trailing slash as if it were a path separator, returning
 * `https:/`. Nothing threw: `robots.txt` simply shipped a sitemap at `https://sitemaps/`
 * for months, and Google never found the site's 600k+ URLs.
 *
 * So the result is parsed rather than string-patched, and anything without a hostname
 * falls back to a real origin. Only `robots.txt` is baked at build time (every other
 * caller renders per request, where the variable is set), and it must stay static to
 * remain cacheable at the edge -- hence a production fallback rather than localhost.
 */
export const getURL = () => {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_VERCEL_URL?.trim();

  const fallback = process.env.NODE_ENV === 'production' ? PRODUCTION_URL : DEVELOPMENT_URL;
  if (!configured) return fallback;

  try {
    const url = new URL(/^https?:\/\//.test(configured) ? configured : `https://${configured}`);
    if (!url.hostname) return fallback;
    return url.href.endsWith('/') ? url.href.slice(0, -1) : url.href;
  } catch {
    return fallback;
  }
};
