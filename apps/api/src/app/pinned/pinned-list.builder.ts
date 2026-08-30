import { asc, eq, SQL, sql } from 'drizzle-orm';
import { DbTransaction } from '@libs/db';
import {
  pinnedItem,
  playlist,
  tmdbMovieView,
  tmdbPersonView,
  tmdbTvSeriesView,
} from '@libs/db/schemas';
import {
  MOVIE_COMPACT_SELECT,
  PERSON_COMPACT_SELECT,
  TV_SERIES_COMPACT_SELECT,
} from '@libs/db/selectors';
import { SupportedLocale } from '@libs/i18n';
import { DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import { User } from '../auth/auth.service';
import { canViewPlaylist } from '../playlists/playlists.permission';
import { PlaylistQueryBuilder } from '../playlists/playlists.query-builder';
import { PlaylistRole } from '../playlists/types/playlist-role.type';
import { PINNED_ITEM_RULES } from '../../config/validation-rules';
import { PinnedItemUnion } from './dto/pinned.dto';
import { buildPinnedItemsResponse, PinnedItemRow } from './pinned.mapper';

export async function buildOwnPinnedItemsList({
  tx,
  currentUser,
  isPremium,
  locale,
}: {
  tx: DbTransaction | DrizzleService;
  currentUser: User;
  isPremium: boolean;
  locale: SupportedLocale;
}): Promise<PinnedItemUnion[]> {
  await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

  const actualLimit = isPremium ? PINNED_ITEM_RULES.MAX.PREMIUM : PINNED_ITEM_RULES.MAX.FREE;

  const rawRows = await tx
    .select({
      item: pinnedItem,
      movie: MOVIE_COMPACT_SELECT,
      tvSeries: TV_SERIES_COMPACT_SELECT,
      person: PERSON_COMPACT_SELECT,
      playlist,
      playlistRole: PlaylistQueryBuilder.getRoleSelection(currentUser) as SQL<PlaylistRole | null>,
      playlistAccessible: canViewPlaylist(tx, currentUser) as SQL<boolean>,
    })
    .from(pinnedItem)
    .leftJoin(tmdbMovieView, eq(pinnedItem.movieId, tmdbMovieView.id))
    .leftJoin(tmdbTvSeriesView, eq(pinnedItem.tvSeriesId, tmdbTvSeriesView.id))
    .leftJoin(tmdbPersonView, eq(pinnedItem.personId, tmdbPersonView.id))
    .leftJoin(playlist, eq(pinnedItem.playlistId, playlist.id))
    .where(eq(pinnedItem.userId, currentUser.id))
    .orderBy(asc(pinnedItem.rank), asc(pinnedItem.id));

  const rows: PinnedItemRow[] = rawRows.map(({ playlistRole, ...row }, index) => ({
    ...row,
    playlist: row.playlist ? { ...row.playlist, role: playlistRole } : null,
    overLimit: index >= actualLimit,
  }));

  return buildPinnedItemsResponse(rows, { isOwner: true });
}
