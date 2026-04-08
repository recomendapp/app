import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { playlist, playlistItem, playlistMember, profile } from '@libs/db/schemas';
import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { User } from '../../auth/auth.service';
import { LexoRank } from 'lexorank';
import { PlaylistsAddQueryDto } from './playlists-add.dto';
import { plainToInstance } from 'class-transformer';
import { PlaylistItemDto } from '../items/playlist-items.dto';
import { PlaylistsGateway } from '../playlists.gateway';

@Injectable()
export class PlaylistsAddService {
  private readonly logger = new Logger(PlaylistsAddService.name);

  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    private readonly playlistsGateway: PlaylistsGateway,
  ) {}

  async add({
    user,
    type,
    mediaId,
    dto,
  }: {
    user: User;
    type: 'movie' | 'tv_series';
    mediaId: number;
    dto: PlaylistsAddQueryDto;
  }): Promise<PlaylistItemDto[]> {
    const uniquePlaylistIds = [...new Set(dto.playlistIds)];
    if (uniquePlaylistIds.length === 0) return [];

    const insertedItems = await this.db.transaction(async (tx) => {
      const authorizedPlaylistsQuery = await tx
        .select({ id: playlist.id })
        .from(playlist)
        .leftJoin(playlistMember, and(
          eq(playlistMember.playlistId, playlist.id),
          eq(playlistMember.userId, user.id)
        ))
        .innerJoin(profile, eq(profile.id, playlist.userId))
        .where(
          and(
            inArray(playlist.id, uniquePlaylistIds),
            or(
              eq(playlist.userId, user.id),
              and(
                inArray(playlistMember.role, ['editor', 'admin']),
                eq(profile.isPremium, true)
              )
            )
          )
        );

      const authIds = authorizedPlaylistsQuery.map(p => p.id);

      if (authIds.length === 0) {
        throw new ForbiddenException("You don't have permission to add items to any of the requested playlists.");
      }

      const ranksQuery = await tx
        .select({
          playlistId: playlistItem.playlistId,
          maxRank: sql<string>`MAX(${playlistItem.rank})` 
        })
        .from(playlistItem)
        .where(inArray(playlistItem.playlistId, authIds))
        .groupBy(playlistItem.playlistId);

      const rankMap = new Map(ranksQuery.map(r => [r.playlistId, r.maxRank]));

      const valuesToInsert = authIds.map((pid): typeof playlistItem.$inferInsert => {
        const maxRankStr = rankMap.get(pid);
        let nextRankString: string;

        if (maxRankStr) {
          const lastRankLexo = LexoRank.parse(maxRankStr);
          nextRankString = lastRankLexo.genNext().toString();
        } else {
          nextRankString = LexoRank.middle().toString();
        }

        return {
          playlistId: pid,
          userId: user.id,
          type: type,
          movieId: type === 'movie' ? mediaId : null,
          tvSeriesId: type === 'tv_series' ? mediaId : null,
          rank: nextRankString,
          comment: dto.comment,
        };
      });

      return await tx.insert(playlistItem)
        .values(valuesToInsert)
        .returning();
    });

    for (const item of insertedItems) {
      this.playlistsGateway.broadcastItemAdded(item.playlistId, [{
        id: item.id,
        playlistId: item.playlistId,
        mediaId: item.type === 'movie' ? item.movieId : item.tvSeriesId,
        type: item.type,
        rank: item.rank,
        comment: item.comment,
      }]);
    }

    return plainToInstance(PlaylistItemDto, insertedItems.map(({ movieId, tvSeriesId, ...item }) => ({
      ...item,
      mediaId: item.type === 'movie' ? movieId : tvSeriesId,
    })));
  }
}