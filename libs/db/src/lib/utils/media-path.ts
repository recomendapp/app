function normalizeSegment(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function mediaSlug(id: number, title: string | null | undefined): string {
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
