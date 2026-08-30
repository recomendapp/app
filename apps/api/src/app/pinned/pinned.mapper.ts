import { plainToInstance } from 'class-transformer';
import { pinnedItem } from '@libs/db/schemas';
import {
  PinnedItemStatus,
  PinnedItemUnion,
  PinnedItemWithMovieDto,
  PinnedItemWithPersonDto,
  PinnedItemWithPlaylistDto,
  PinnedItemWithTvSeriesDto,
} from './dto/pinned.dto';

export type PinnedItemRow = {
  item: typeof pinnedItem.$inferSelect;
  movie: Record<string, unknown> | null;
  tvSeries: Record<string, unknown> | null;
  person: Record<string, unknown> | null;
  // Already merged with the current user's `role` for it by the caller.
  playlist: Record<string, unknown> | null;
  // NULL when the row isn't a playlist pin; otherwise whether `currentUser` can currently see the playlist.
  playlistAccessible: boolean | null;
  // Whether this row's rank position falls beyond the profile's currently active plan limit.
  // Always false when the caller only ever fetches rows within that limit (the non-owner path).
  overLimit: boolean;
};

/**
 * Builds the public response shape for a batch of already-fetched pinned item rows.
 * For an inaccessible pinned playlist: dropped entirely for a non-owner viewer (no metadata
 * leak about what's pinned there), kept with `data: null` for the owner's own management view
 * (so they can still see/reorder/unpin the entry). Rows beyond the profile's plan limit are
 * marked `over_limit` (never dropped — the owner needs to see/manage them too).
 */
export function buildPinnedItemsResponse(
  rows: PinnedItemRow[],
  { isOwner }: { isOwner: boolean },
): PinnedItemUnion[] {
  const result: PinnedItemUnion[] = [];

  for (const row of rows) {
    const { movieId, tvSeriesId, playlistId, personId, ...base } = row.item;
    const isUnavailablePlaylist = base.type === 'playlist' && !row.playlistAccessible;

    if (isUnavailablePlaylist && !isOwner) continue;

    const status = isUnavailablePlaylist
      ? PinnedItemStatus.UNAVAILABLE
      : row.overLimit
        ? PinnedItemStatus.OVER_LIMIT
        : PinnedItemStatus.AVAILABLE;

    if (base.type === 'movie') {
      result.push(
        plainToInstance(
          PinnedItemWithMovieDto,
          { ...base, status, data: row.movie },
          { excludeExtraneousValues: true },
        ),
      );
      continue;
    }

    if (base.type === 'tv_series') {
      result.push(
        plainToInstance(
          PinnedItemWithTvSeriesDto,
          { ...base, status, data: row.tvSeries },
          { excludeExtraneousValues: true },
        ),
      );
      continue;
    }

    if (base.type === 'person') {
      result.push(
        plainToInstance(
          PinnedItemWithPersonDto,
          { ...base, status, data: row.person },
          { excludeExtraneousValues: true },
        ),
      );
      continue;
    }

    result.push(
      plainToInstance(
        PinnedItemWithPlaylistDto,
        { ...base, status, data: isUnavailablePlaylist ? null : row.playlist },
        { excludeExtraneousValues: true },
      ),
    );
  }

  return result;
}
