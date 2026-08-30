import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, SQL, sql } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import {
  follow,
  pinnedItem,
  playlist,
  profile,
  tmdbMovieView,
  tmdbPersonView,
  tmdbTvSeriesView,
} from '@libs/db/schemas';
import {
  MOVIE_COMPACT_SELECT,
  PERSON_COMPACT_SELECT,
  TV_SERIES_COMPACT_SELECT,
} from '@libs/db/selectors';
import { User } from '../../auth/auth.service';
import { SupportedLocale } from '@libs/i18n';
import { PINNED_ITEM_RULES } from '../../../config/validation-rules';
import { canViewPlaylist } from '../../playlists/playlists.permission';
import { PlaylistQueryBuilder } from '../../playlists/playlists.query-builder';
import { PlaylistRole } from '../../playlists/types/playlist-role.type';
import { PinnedItemUnion } from '../../pinned/dto/pinned.dto';
import { buildPinnedItemsResponse, PinnedItemRow } from '../../pinned/pinned.mapper';
import { buildOwnPinnedItemsList } from '../../pinned/pinned-list.builder';

@Injectable()
export class UserPinnedService {
  constructor(@Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService) {}

  async list({
    targetUserId,
    currentUser,
    locale,
  }: {
    targetUserId: string;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<PinnedItemUnion[]> {
    return await this.db.transaction(async (tx) => {
      const targetProfile = await tx.query.profile.findFirst({
        where: eq(profile.id, targetUserId),
      });

      if (!targetProfile) {
        throw new NotFoundException('User not found.');
      }

      const isOwner = currentUser?.id === targetUserId;

      if (!isOwner && targetProfile.isPrivate) {
        if (!currentUser) {
          throw new ForbiddenException('This account is private.');
        }

        const amIFollowing = await tx.query.follow.findFirst({
          where: and(
            eq(follow.followerId, currentUser.id),
            eq(follow.followingId, targetUserId),
            eq(follow.status, 'accepted'),
          ),
        });

        if (!amIFollowing) {
          throw new ForbiddenException(
            'This account is private. Follow this user to see their pinned items.',
          );
        }
      }

      if (isOwner) {
        return buildOwnPinnedItemsList({
          tx,
          currentUser: currentUser,
          isPremium: targetProfile.isPremium,
          locale,
        });
      }

      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const maxAllowed = targetProfile.isPremium
        ? PINNED_ITEM_RULES.MAX.PREMIUM
        : PINNED_ITEM_RULES.MAX.FREE;

      const limitedIdsSubquery = tx
        .select({ id: pinnedItem.id })
        .from(pinnedItem)
        .where(eq(pinnedItem.userId, targetUserId))
        .orderBy(asc(pinnedItem.rank), asc(pinnedItem.id))
        .limit(maxAllowed)
        .as('limited_pinned_items');

      const rawRows = await tx
        .select({
          item: pinnedItem,
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
          person: PERSON_COMPACT_SELECT,
          playlist,
          playlistRole: PlaylistQueryBuilder.getRoleSelection(
            currentUser,
          ) as SQL<PlaylistRole | null>,
          playlistAccessible: canViewPlaylist(tx, currentUser) as SQL<boolean>,
        })
        .from(limitedIdsSubquery)
        .innerJoin(pinnedItem, eq(pinnedItem.id, limitedIdsSubquery.id))
        .leftJoin(tmdbMovieView, eq(pinnedItem.movieId, tmdbMovieView.id))
        .leftJoin(tmdbTvSeriesView, eq(pinnedItem.tvSeriesId, tmdbTvSeriesView.id))
        .leftJoin(tmdbPersonView, eq(pinnedItem.personId, tmdbPersonView.id))
        .leftJoin(playlist, eq(pinnedItem.playlistId, playlist.id))
        .orderBy(asc(pinnedItem.rank), asc(pinnedItem.id));

      const rows: PinnedItemRow[] = rawRows.map(({ playlistRole, ...row }) => ({
        ...row,
        playlist: row.playlist ? { ...row.playlist, role: playlistRole } : null,
        overLimit: false,
      }));

      return buildPinnedItemsResponse(rows, { isOwner: false });
    });
  }
}
