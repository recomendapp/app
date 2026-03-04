import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';
import { playlist, playlistItem, tmdbMovieView, tmdbTvSeriesView } from '@libs/db/schemas';
import { and, asc, eq, gt, or, sql, SQL } from 'drizzle-orm';
import { plainToInstance } from 'class-transformer';
import { 
  PlaylistItemWithMediaUnion, 
  ListAllPlaylistItemsQueryDto, 
  ListPaginatedPlaylistItemsQueryDto, 
  ListPaginatedPlaylistItemsDto, 
  ListInfinitePlaylistItemsQueryDto, 
  ListInfinitePlaylistItemsDto 
} from './dto/playlist-items.dto'; 
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { MOVIE_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { canViewPlaylist } from '../playlists.permission';

@Injectable()
export class PlaylistItemsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}


  /* ---------------------------------- List ---------------------------------- */
  private async checkPlaylistAccess(playlistId: number, currentUser: User | null): Promise<void> {
    const playlistCheck = await this.db.query.playlist.findFirst({
      where: and(
        eq(playlist.id, playlistId),
        canViewPlaylist(this.db, currentUser)
      ),
      columns: { id: true }
    });

    if (!playlistCheck) {
      throw new NotFoundException('Playlist not found or access denied');
    }
  }
//   async listAll({
//     playlistId,
//     currentUser,
//   }: {
//     playlistId: number;
//     currentUser: User | null;
//   }): Promise<PlaylistItemWithMediaUnion[]> {
//     await this.checkPlaylistAccess(playlistId, currentUser);
//     const results = await this.db.select({
//         item: playlistItem,
//         movie: {
//           id: tmdbMovieView.id,
//           title: tmdbMovieView.title,
//           posterPath: tmdbMovieView.posterPath,
//           // ... ajoute les autres champs dont tu as besoin
//         },
//         tvSeries: {
//           id: tmdbTvSeriesView.id,
//           name: tmdbTvSeriesView.name,
//           posterPath: tmdbTvSeriesView.posterPath,
//           // ... ajoute les autres champs
//         },
//       })
//       .from(playlistItem)
//       .where(eq(playlistItem.playlistId, playlistId))
//       .leftJoin(tmdbMovieView, eq(playlistItem.movieId, tmdbMovieView.id))
//       .leftJoin(tmdbTvSeriesView, eq(playlistItem.tvSeriesId, tmdbTvSeriesView.id))
//       .orderBy(asc(playlistItem.rank)); // Une playlist s'ordonne généralement par son 'rank' ASC

//     const rawArray = results.map((row) => {
//       const { movieId, tvSeriesId, ...baseItem } = row.item;
//       if (baseItem.type === 'movie') {
//         return { ...baseItem, type: 'movie', mediaId: movieId, media: row.movie };
//       }
//       return { ...baseItem, type: 'tv_series', mediaId: tvSeriesId, media: row.tvSeries };
//     });

//     return plainToInstance(PlaylistItemWithMediaUnion, rawArray, { excludeExtraneousValues: true }); 
//   }
  async listPaginated({
    playlistId,
    query,
    currentUser,
  }: {
    playlistId: number;
    query: ListPaginatedPlaylistItemsQueryDto;
    currentUser: User | null;
  }): Promise<ListPaginatedPlaylistItemsDto> {
    await this.checkPlaylistAccess(playlistId, currentUser);

    const { per_page, page } = query;
    const offset = (page - 1) * per_page;

    const baseWhere = eq(playlistItem.playlistId, playlistId);

    const [results, [{ count: totalCount }]] = await Promise.all([
      this.db.select({
          item: playlistItem,
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
        })
        .from(playlistItem)
        .where(baseWhere)
        .leftJoin(tmdbMovieView, eq(playlistItem.movieId, tmdbMovieView.id))
        .leftJoin(tmdbTvSeriesView, eq(playlistItem.tvSeriesId, tmdbTvSeriesView.id))
        .orderBy(asc(playlistItem.rank))
        .limit(per_page)
        .offset(offset),
      this.db.select({ count: sql<number>`cast(count(*) as int)` }).from(playlistItem).where(baseWhere)
    ]);

    return plainToInstance(ListPaginatedPlaylistItemsDto, {
      data: results.map((row) => {
        const { movieId, tvSeriesId, ...baseItem } = row.item;
        if (baseItem.type === 'movie') {
          return { ...baseItem, type: 'movie', mediaId: movieId, media: row.movie };
        }
        return { ...baseItem, type: 'tv_series', mediaId: tvSeriesId, media: row.tvSeries };
      }),
      meta: {
        total_results: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page,
      },
    });
  }
  async listInfinite({
    playlistId,
    query,
    currentUser,
  }: {
    playlistId: number;
    query: ListInfinitePlaylistItemsQueryDto;
    currentUser: User | null;
  }): Promise<ListInfinitePlaylistItemsDto> {
    await this.checkPlaylistAccess(playlistId, currentUser);

    const { per_page, cursor } = query;
    const cursorData = cursor ? decodeCursor<BaseCursor<number, number>>(cursor) : null;

    let whereClause: SQL = eq(playlistItem.playlistId, playlistId);

    if (cursorData) {
      const rankValue = Number(cursorData.value);
      whereClause = and(
        whereClause,
        or(
          gt(playlistItem.rank, rankValue),
          and(
            eq(playlistItem.rank, rankValue),
            gt(playlistItem.id, cursorData.id)
          )
        )
      );
    }

    const fetchLimit = per_page + 1;

    const [results, totalCountResult] = await Promise.all([
      this.db.select({
          item: playlistItem,
          movie: MOVIE_COMPACT_SELECT,
          tvSeries: TV_SERIES_COMPACT_SELECT,
        })
        .from(playlistItem)
        .where(whereClause)
        .leftJoin(tmdbMovieView, eq(playlistItem.movieId, tmdbMovieView.id))
        .leftJoin(tmdbTvSeriesView, eq(playlistItem.tvSeriesId, tmdbTvSeriesView.id))
        .orderBy(asc(playlistItem.rank), asc(playlistItem.id))
        .limit(fetchLimit),
      !cursorData 
        ? this.db.select({ count: sql<number>`cast(count(*) as int)` }).from(playlistItem).where(eq(playlistItem.playlistId, playlistId))
        : Promise.resolve(undefined)
    ]);

    const totalCount = totalCountResult ? totalCountResult[0].count : undefined;
    const hasNextPage = results.length > per_page;
    const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

    let nextCursor: string | null = null;
    if (hasNextPage) {
      const lastItem = paginatedResults[paginatedResults.length - 1].item;
      nextCursor = encodeCursor<BaseCursor<number, number>>({
        value: lastItem.rank,
        id: lastItem.id,
      });
    }

    return plainToInstance(ListInfinitePlaylistItemsDto, {
      data: paginatedResults.map((row) => {
        const { movieId, tvSeriesId, ...baseItem } = row.item;
        if (baseItem.type === 'movie') {
          return { ...baseItem, type: 'movie', mediaId: movieId, media: row.movie };
        }
        return { ...baseItem, type: 'tv_series', mediaId: tvSeriesId, media: row.tvSeries };
      }),
      meta: {
        next_cursor: nextCursor,
        per_page,
        total_results: totalCount,
      }
    });
  }
}