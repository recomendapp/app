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

export function tvSeasonPath(tvSeriesId: number, seasonNumber: number): string {
  return `/tv-series/${tvSeriesId}/season/${seasonNumber}`;
}

export function tvEpisodePath(
  tvSeriesId: number,
  seasonNumber: number,
  episodeNumber: number,
): string {
  return `${tvSeasonPath(tvSeriesId, seasonNumber)}/episode/${episodeNumber}`;
}
