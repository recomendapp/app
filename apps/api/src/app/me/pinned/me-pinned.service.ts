import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, inArray, ne, SQL, sql } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import {
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
import { LexoRank } from 'lexorank';
import { plainToInstance } from 'class-transformer';
import { PinnedServerEvents } from '@libs/realtime';
import { RealtimeGateway } from '../../realtime/realtime.gateway';
import {
  PinnedItemCreateDto,
  PinnedItemDto,
  PinnedItemUnion,
  PinnedItemUpdateDto,
  PinnedItemsDeleteDto,
} from '../../pinned/dto/pinned.dto';
import { buildPinnedItemsResponse } from '../../pinned/pinned.mapper';
import { computePinnedItemStatusSignals } from '../../pinned/pinned-status.builder';

@Injectable()
export class MePinnedService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async add({
    currentUser,
    dto,
    locale,
  }: {
    currentUser: User;
    dto: PinnedItemCreateDto;
    locale: SupportedLocale;
  }): Promise<PinnedItemUnion> {
    const result = await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const currentProfile = await tx.query.profile.findFirst({
        where: eq(profile.id, currentUser.id),
      });
      if (!currentProfile) {
        throw new NotFoundException('Profile not found.');
      }

      const maxAllowed = currentProfile.isPremium
        ? PINNED_ITEM_RULES.MAX.PREMIUM
        : PINNED_ITEM_RULES.MAX.FREE;

      const [{ count }] = await tx
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(pinnedItem)
        .where(eq(pinnedItem.userId, currentUser.id));

      if (count >= maxAllowed) {
        throw new ForbiddenException({
          statusCode: 403,
          error: 'Forbidden',
          message: `You have reached the maximum of ${maxAllowed} pinned items allowed for your plan.`,
          // Free users hitting their cap could raise it by upgrading; premium users hitting the
          // hard cap (10) can't — they just need to unpin something first. Lets the client decide
          // whether to send them to the upgrade page instead of guessing from the status code alone.
          upgradable: !currentProfile.isPremium,
        });
      }

      const duplicateReferenceWhere =
        dto.type === 'movie'
          ? eq(pinnedItem.movieId, dto.mediaId)
          : dto.type === 'tv_series'
            ? eq(pinnedItem.tvSeriesId, dto.mediaId)
            : dto.type === 'playlist'
              ? eq(pinnedItem.playlistId, dto.mediaId)
              : eq(pinnedItem.personId, dto.mediaId);

      const existing = await tx.query.pinnedItem.findFirst({
        where: and(
          eq(pinnedItem.userId, currentUser.id),
          eq(pinnedItem.type, dto.type),
          duplicateReferenceWhere,
        ),
      });
      if (existing) {
        throw new ConflictException('This item is already pinned.');
      }

      let movieData: Record<string, unknown> | null = null;
      let tvSeriesData: Record<string, unknown> | null = null;
      let personData: Record<string, unknown> | null = null;
      let playlistData: Record<string, unknown> | null = null;

      if (dto.type === 'movie') {
        const [row] = await tx
          .select(MOVIE_COMPACT_SELECT)
          .from(tmdbMovieView)
          .where(eq(tmdbMovieView.id, dto.mediaId));
        if (!row) throw new NotFoundException('Movie not found.');
        movieData = row;
      } else if (dto.type === 'tv_series') {
        const [row] = await tx
          .select(TV_SERIES_COMPACT_SELECT)
          .from(tmdbTvSeriesView)
          .where(eq(tmdbTvSeriesView.id, dto.mediaId));
        if (!row) throw new NotFoundException('TV series not found.');
        tvSeriesData = row;
      } else if (dto.type === 'person') {
        const [row] = await tx
          .select(PERSON_COMPACT_SELECT)
          .from(tmdbPersonView)
          .where(eq(tmdbPersonView.id, dto.mediaId));
        if (!row) throw new NotFoundException('Person not found.');
        personData = row;
      } else {
        const [row] = await tx
          .select({
            playlist,
            role: PlaylistQueryBuilder.getRoleSelection(currentUser) as SQL<PlaylistRole | null>,
          })
          .from(playlist)
          .where(and(eq(playlist.id, dto.mediaId), canViewPlaylist(tx, currentUser)));
        if (!row)
          throw new NotFoundException('Playlist not found, or you do not have access to it.');
        playlistData = { ...row.playlist, role: row.role };
      }

      const [{ maxRank }] = await tx
        .select({ maxRank: sql<string | null>`MAX(${pinnedItem.rank})` })
        .from(pinnedItem)
        .where(eq(pinnedItem.userId, currentUser.id));

      const rank = maxRank
        ? LexoRank.parse(maxRank).genNext().toString()
        : LexoRank.middle().toString();

      const [inserted] = await tx
        .insert(pinnedItem)
        .values({
          userId: currentUser.id,
          type: dto.type,
          movieId: dto.type === 'movie' ? dto.mediaId : null,
          tvSeriesId: dto.type === 'tv_series' ? dto.mediaId : null,
          playlistId: dto.type === 'playlist' ? dto.mediaId : null,
          personId: dto.type === 'person' ? dto.mediaId : null,
          rank,
        })
        .returning();

      const [result] = buildPinnedItemsResponse(
        [
          {
            item: inserted,
            movie: movieData,
            tvSeries: tvSeriesData,
            person: personData,
            playlist: playlistData,
            playlistAccessible: dto.type === 'playlist' ? true : null,
            // A newly-inserted item can never be over_limit: add() already refused the insert if
            // the profile was at or above its current tier's limit.
            overLimit: false,
          },
        ],
        { isOwner: true },
      );

      return result;
    });

    this.realtimeGateway.emitToUser(currentUser.id, PinnedServerEvents.SET, result);

    return result;
  }

  async update({
    currentUser,
    pinnedItemId,
    dto,
  }: {
    currentUser: User;
    pinnedItemId: number;
    dto: PinnedItemUpdateDto;
  }): Promise<PinnedItemDto> {
    const { result, statusSignals } = await this.db.transaction(async (tx) => {
      let newRankString: string;

      if (dto.position <= 1) {
        const [firstItem] = await tx
          .select({ rank: pinnedItem.rank })
          .from(pinnedItem)
          .where(and(eq(pinnedItem.userId, currentUser.id), ne(pinnedItem.id, pinnedItemId)))
          .orderBy(asc(pinnedItem.rank))
          .limit(1);

        newRankString = firstItem
          ? LexoRank.parse(firstItem.rank).genPrev().toString()
          : LexoRank.middle().toString();
      } else {
        const offset = dto.position - 2;

        const neighbors = await tx
          .select({ rank: pinnedItem.rank })
          .from(pinnedItem)
          .where(and(eq(pinnedItem.userId, currentUser.id), ne(pinnedItem.id, pinnedItemId)))
          .orderBy(asc(pinnedItem.rank))
          .offset(offset)
          .limit(2);

        if (neighbors.length === 2) {
          newRankString = LexoRank.parse(neighbors[0].rank)
            .between(LexoRank.parse(neighbors[1].rank))
            .toString();
        } else if (neighbors.length === 1) {
          newRankString = LexoRank.parse(neighbors[0].rank).genNext().toString();
        } else {
          const [lastItem] = await tx
            .select({ rank: pinnedItem.rank })
            .from(pinnedItem)
            .where(and(eq(pinnedItem.userId, currentUser.id), ne(pinnedItem.id, pinnedItemId)))
            .orderBy(desc(pinnedItem.rank))
            .limit(1);

          newRankString = lastItem
            ? LexoRank.parse(lastItem.rank).genNext().toString()
            : LexoRank.middle().toString();
        }
      }

      const [updated] = await tx
        .update(pinnedItem)
        .set({ rank: newRankString })
        .where(and(eq(pinnedItem.id, pinnedItemId), eq(pinnedItem.userId, currentUser.id)))
        .returning();

      if (!updated) {
        throw new NotFoundException('Pinned item not found.');
      }

      const currentProfile = await tx.query.profile.findFirst({
        where: eq(profile.id, currentUser.id),
      });

      // Reordering can shift which rows fall within the profile's limit (an item moving up can
      // bump another one out) — recompute the lightweight status for every row rather than just
      // this one's rank. No media joins here, so this stays cheap regardless of pin types.
      const statusSignals = await computePinnedItemStatusSignals({
        tx,
        currentUser,
        isPremium: currentProfile?.isPremium ?? false,
      });

      const { movieId, tvSeriesId, playlistId, personId, ...base } = updated;
      return { result: plainToInstance(PinnedItemDto, base), statusSignals };
    });

    this.realtimeGateway.emitToUser(currentUser.id, PinnedServerEvents.REORDERED, statusSignals);

    return result;
  }

  async delete({
    currentUser,
    dto,
  }: {
    currentUser: User;
    dto: PinnedItemsDeleteDto;
  }): Promise<PinnedItemDto[]> {
    const uniqueItemIds = [...new Set(dto.itemIds)];
    if (uniqueItemIds.length === 0) return [];

    const deletedItems = await this.db
      .delete(pinnedItem)
      .where(and(eq(pinnedItem.userId, currentUser.id), inArray(pinnedItem.id, uniqueItemIds)))
      .returning();

    const result = plainToInstance(
      PinnedItemDto,
      deletedItems.map(({ movieId, tvSeriesId, playlistId, personId, ...item }) => item),
    );

    if (result.length > 0) {
      // Removing an item can shift which of the remaining rows fall within the profile's limit
      // (e.g. deleting #2 out of an over-the-limit list bumps #5 back into view) — recompute the
      // lightweight status for what's left rather than just diffing out the deleted ids. No media
      // joins here, so this stays cheap regardless of how many/what type of items remain.
      const currentProfile = await this.db.query.profile.findFirst({
        where: eq(profile.id, currentUser.id),
      });
      const statusSignals = await computePinnedItemStatusSignals({
        tx: this.db,
        currentUser,
        isPremium: currentProfile?.isPremium ?? false,
      });

      this.realtimeGateway.emitToUser(currentUser.id, PinnedServerEvents.DELETED, {
        userId: currentUser.id,
        deleted: result.map((item) => item.id),
        updated: statusSignals,
      });
    }

    return result;
  }
}
