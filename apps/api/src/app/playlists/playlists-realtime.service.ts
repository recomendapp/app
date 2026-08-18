import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { DRIZZLE_SERVICE, DrizzleService } from '../../common/modules/drizzle/drizzle.module';
import {
  playlist,
  playlistItem,
  playlistMember,
  tmdbMovieView,
  tmdbTvSeriesView,
  user,
} from '@libs/db/schemas';
import { MOVIE_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { SupportedLocale } from '@libs/i18n';
import { IPlaylistItemUpdatedSignal, PlaylistServerEvents } from '@libs/realtime';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PlaylistItemWithMediaUnion } from './items/playlist-items.dto';

interface Recipient {
  userId: string;
  locale: SupportedLocale;
}

@Injectable()
export class PlaylistsRealtimeService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  private async getRecipients(playlistId: number): Promise<Recipient[]> {
    const [ownerRows, memberRows] = await Promise.all([
      this.db
        .select({ userId: playlist.userId, locale: user.language })
        .from(playlist)
        .innerJoin(user, eq(user.id, playlist.userId))
        .where(eq(playlist.id, playlistId))
        .limit(1),
      this.db
        .select({ userId: playlistMember.userId, locale: user.language })
        .from(playlistMember)
        .innerJoin(user, eq(user.id, playlistMember.userId))
        .where(eq(playlistMember.playlistId, playlistId)),
    ]);

    const recipientsByUserId = new Map<string, Recipient>();
    for (const row of [...ownerRows, ...memberRows]) {
      recipientsByUserId.set(row.userId, {
        userId: row.userId,
        locale: row.locale as SupportedLocale,
      });
    }
    return [...recipientsByUserId.values()];
  }

  private groupByLocale(recipients: Recipient[]): Map<SupportedLocale, string[]> {
    const userIdsByLocale = new Map<SupportedLocale, string[]>();
    for (const { userId, locale } of recipients) {
      const group = userIdsByLocale.get(locale) ?? [];
      group.push(userId);
      userIdsByLocale.set(locale, group);
    }
    return userIdsByLocale;
  }

  private async getItemsWithMedia(
    playlistId: number,
    itemIds: number[],
    locale: SupportedLocale,
  ): Promise<PlaylistItemWithMediaUnion[]> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const rows = await tx
        .select({
          item: playlistItem,
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
        })
        .from(playlistItem)
        .where(and(eq(playlistItem.playlistId, playlistId), inArray(playlistItem.id, itemIds)))
        .leftJoin(tmdbMovieView, eq(playlistItem.movieId, tmdbMovieView.id))
        .leftJoin(tmdbTvSeriesView, eq(playlistItem.tvSeriesId, tmdbTvSeriesView.id));

      return rows.map((row): PlaylistItemWithMediaUnion => {
        const { movieId, tvSeriesId, ...baseItem } = row.item;
        if (baseItem.type === 'movie') {
          return { ...baseItem, type: 'movie', mediaId: movieId, media: row.movie };
        }
        return { ...baseItem, type: 'tv_series', mediaId: tvSeriesId, media: row.tvSeries };
      });
    });
  }

  async broadcastItemAdded(playlistId: number, itemIds: number[]) {
    if (itemIds.length === 0) return;

    const recipients = await this.getRecipients(playlistId);
    if (recipients.length === 0) return;

    const userIdsByLocale = this.groupByLocale(recipients);

    await Promise.all(
      [...userIdsByLocale.entries()].map(async ([locale, userIds]) => {
        const items = await this.getItemsWithMedia(playlistId, itemIds, locale);
        if (items.length === 0) return;
        this.realtimeGateway.emitToUsers(userIds, PlaylistServerEvents.ITEM_ADDED, items);
      }),
    );
  }

  async broadcastItemUpdated(
    playlistId: number,
    item: Omit<IPlaylistItemUpdatedSignal, 'playlistId'>,
  ) {
    const recipients = await this.getRecipients(playlistId);
    const userIds = recipients.map((recipient) => recipient.userId);
    this.realtimeGateway.emitToUsers(userIds, PlaylistServerEvents.ITEM_UPDATED, {
      ...item,
      playlistId,
    });
  }

  async broadcastItemDeleted(playlistId: number, itemIds: number[]) {
    const recipients = await this.getRecipients(playlistId);
    const userIds = recipients.map((recipient) => recipient.userId);
    this.realtimeGateway.emitToUsers(userIds, PlaylistServerEvents.ITEM_DELETED, {
      playlistId,
      itemIds,
    });
  }
}
