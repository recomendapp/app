function normalizeSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function mediaSlug(id: number | string, title: string | null | undefined): string {
  // `string` is not defensive typing: Postgres returns `bigint` columns as strings, so a
  // tv series id arrives as `'342719183'` while a movie id arrives as a number. What must
  // never get through is an absent one -- it used to stringify to the literal
  // `"undefined"` and ship as a real URL (`/film/undefined`), which nothing downstream
  // can tell from a legitimate slug. An id is a primary key at every call site, so there
  // is no case to degrade to.
  const numericId = typeof id === 'string' && id.trim() !== '' ? Number(id) : id;
  if (typeof numericId !== 'number' || !Number.isFinite(numericId)) {
    throw new TypeError(`mediaSlug needs a numeric id, received ${String(id)}`);
  }

  const normalizedTitle = title ? normalizeSegment(title) : '';
  return normalizedTitle ? `${id}-${normalizedTitle}` : String(id);
}

export function moviePath(id: number, title: string | null | undefined): string {
  return `/film/${mediaSlug(id, title)}`;
}

export function tvSeriesPath(id: number, name: string | null | undefined): string {
  return `/tv-series/${mediaSlug(id, name)}`;
}

export function personPath(id: number, name: string | null | undefined): string {
  return `/person/${mediaSlug(id, name)}`;
}

/**
 * `tvSeriesName` is optional because not every caller has it to hand, and `mediaSlug`
 * already degrades to the bare id without one. Pass it wherever it is available: a
 * season URL carries the *series* slug, so omitting the name yields `/tv-series/1399/...`
 * while the series page itself canonicalises to `/tv-series/1399-game-of-thrones`, and
 * the two then disagree about the same show.
 */
export function tvSeasonPath(
  tvSeriesId: number,
  seasonNumber: number,
  tvSeriesName?: string | null,
): string {
  return `${tvSeriesPath(tvSeriesId, tvSeriesName)}/season/${seasonNumber}`;
}

export function tvEpisodePath(
  tvSeriesId: number,
  seasonNumber: number,
  episodeNumber: number,
  tvSeriesName?: string | null,
): string {
  return `${tvSeasonPath(tvSeriesId, seasonNumber, tvSeriesName)}/episode/${episodeNumber}`;
}
