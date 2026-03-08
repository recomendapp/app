import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, SQL, sql } from 'drizzle-orm';
import { followPerson, tmdbMovieView, tmdbPersonFeedView, tmdbPersonView, tmdbTvSeriesView } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { SupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { plainToInstance } from 'class-transformer';
import { MOVIE_COMPACT_SELECT, PERSON_COMPACT_SELECT, TV_SERIES_COMPACT_SELECT } from '@libs/db/selectors';
import { 
  ListPaginatedPersonFeedQueryDto, 
  ListInfinitePersonFeedQueryDto, 
  ListPaginatedPersonFeedDto, 
  ListInfinitePersonFeedDto, 
  PersonFeedSortBy 
} from '../../persons/feed/dto/person-feed.dto';

@Injectable()
export class FeedPersonsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  private getListBaseQuery(
    userId: string,
    sortBy: PersonFeedSortBy, 
    sortOrder: SortOrder,
    minDate?: string,
    maxDate?: string,
  ) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    
    const orderBy = (() => {
      switch (sortBy) {
        case PersonFeedSortBy.DATE:
        default:
          return [direction(tmdbPersonFeedView.date), direction(tmdbPersonFeedView.mediaId)];
      }
    })();

    const baseConditions: SQL[] = [
      eq(followPerson.userId, userId),
    ];

    if (minDate) {
      baseConditions.push(gte(tmdbPersonFeedView.date, minDate));
    }

    if (maxDate) {
      baseConditions.push(lte(tmdbPersonFeedView.date, maxDate));
    }

    return { 
      orderBy,
      baseWhere: and(...baseConditions)
    };
  }

  async listPaginated({
    query,
    currentUser,
    locale,
  }: {
    query: ListPaginatedPersonFeedQueryDto;
    currentUser: User;
    locale: SupportedLocale;
  }): Promise<ListPaginatedPersonFeedDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, page, sort_by, sort_order, min_date, max_date } = query;
      const offset = (page - 1) * per_page;

      const { orderBy, baseWhere } = this.getListBaseQuery(currentUser.id, sort_by, sort_order, min_date, max_date);

      const paginatedFeedSubquery = tx
        .select({
          personId: tmdbPersonFeedView.personId,
          mediaId: tmdbPersonFeedView.mediaId,
          type: tmdbPersonFeedView.type,
          date: tmdbPersonFeedView.date,
          jobs: tmdbPersonFeedView.jobs,
        })
        .from(tmdbPersonFeedView)
        .innerJoin(followPerson, eq(followPerson.personId, tmdbPersonFeedView.personId))
        .where(baseWhere)
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset)
        .as('paginated_feed');

      const direction = sort_order === SortOrder.ASC ? asc : desc;

      const [results, [{ count: totalCount }]] = await Promise.all([
        tx.select({
            feed: {
              personId: paginatedFeedSubquery.personId,
              mediaId: paginatedFeedSubquery.mediaId,
              type: paginatedFeedSubquery.type,
              date: paginatedFeedSubquery.date,
              jobs: paginatedFeedSubquery.jobs,
            },
            person: PERSON_COMPACT_SELECT,
            movie: MOVIE_COMPACT_SELECT,
            tvSeries: TV_SERIES_COMPACT_SELECT,
          })
          .from(paginatedFeedSubquery)
          .innerJoin(tmdbPersonView, eq(tmdbPersonView.id, paginatedFeedSubquery.personId))
          .leftJoin(tmdbMovieView, and(eq(paginatedFeedSubquery.mediaId, tmdbMovieView.id), eq(paginatedFeedSubquery.type, 'movie')))
          .leftJoin(tmdbTvSeriesView, and(eq(paginatedFeedSubquery.mediaId, tmdbTvSeriesView.id), eq(paginatedFeedSubquery.type, 'tv_series')))
          .orderBy(direction(paginatedFeedSubquery.date), direction(paginatedFeedSubquery.mediaId)),
        
        tx.select({ count: sql<number>`cast(count(*) as int)` })
          .from(tmdbPersonFeedView)
          .innerJoin(followPerson, eq(followPerson.personId, tmdbPersonFeedView.personId))
          .where(baseWhere)
      ]);

      return plainToInstance(ListPaginatedPersonFeedDto, {
        data: results.map(({ feed, person, movie, tvSeries }): ListPaginatedPersonFeedDto['data'][number] => {
          if (feed.type === 'movie') {
            return {
              type: 'movie',
              mediaId: feed.mediaId,
              date: feed.date,
              jobs: feed.jobs,
              person,
              media: movie,
            }
          }
          return {
            type: 'tv_series',
            mediaId: feed.mediaId,
            date: feed.date,
            jobs: feed.jobs,
            person: person,
            media: tvSeries,
          }
        }),
        meta: {
          total_results: totalCount,
          total_pages: Math.ceil(totalCount / per_page),
          current_page: page,
          per_page,
        },
      }, { excludeExtraneousValues: true });
    });
  }

  async listInfinite({
    query,
    currentUser,
    locale,
  }: {
    query: ListInfinitePersonFeedQueryDto;
    currentUser: User;
    locale: SupportedLocale;
  }): Promise<ListInfinitePersonFeedDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, sort_order, sort_by, cursor, include_total_count, min_date, max_date } = query;
      
      const cursorData = cursor ? decodeCursor<BaseCursor<string, number>>(cursor) : null;
      
      const { orderBy, baseWhere } = this.getListBaseQuery(currentUser.id, sort_by, sort_order, min_date, max_date);

      let cursorWhereClause: SQL | undefined;

      if (cursorData) {
        if (sort_order === SortOrder.ASC) {
          cursorWhereClause = sql`(${tmdbPersonFeedView.date}, ${tmdbPersonFeedView.mediaId}) > (${String(cursorData.value)}, ${Number(cursorData.id)})`;
        } else {
          cursorWhereClause = sql`(${tmdbPersonFeedView.date}, ${tmdbPersonFeedView.mediaId}) < (${String(cursorData.value)}, ${Number(cursorData.id)})`;
        }
      }

      const finalWhereClause = cursorWhereClause ? and(baseWhere, cursorWhereClause) : baseWhere;
      const fetchLimit = per_page + 1;

      const infiniteFeedSubquery = tx
        .select({
          personId: tmdbPersonFeedView.personId,
          mediaId: tmdbPersonFeedView.mediaId,
          type: tmdbPersonFeedView.type,
          date: tmdbPersonFeedView.date,
          jobs: tmdbPersonFeedView.jobs,
        })
        .from(tmdbPersonFeedView)
        .innerJoin(followPerson, eq(followPerson.personId, tmdbPersonFeedView.personId))
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit)
        .as('infinite_feed');

      const direction = sort_order === SortOrder.ASC ? asc : desc;

      const [results, totalCountResult] = await Promise.all([
        tx.select({
            feed: {
              personId: infiniteFeedSubquery.personId,
              mediaId: infiniteFeedSubquery.mediaId,
              type: infiniteFeedSubquery.type,
              date: infiniteFeedSubquery.date,
              jobs: infiniteFeedSubquery.jobs,
            },
            person: PERSON_COMPACT_SELECT,
            movie: MOVIE_COMPACT_SELECT,
            tvSeries: TV_SERIES_COMPACT_SELECT,
          })
          .from(infiniteFeedSubquery)
          .innerJoin(tmdbPersonView, eq(tmdbPersonView.id, infiniteFeedSubquery.personId))
          .leftJoin(tmdbMovieView, and(eq(infiniteFeedSubquery.mediaId, tmdbMovieView.id), eq(infiniteFeedSubquery.type, 'movie')))
          .leftJoin(tmdbTvSeriesView, and(eq(infiniteFeedSubquery.mediaId, tmdbTvSeriesView.id), eq(infiniteFeedSubquery.type, 'tv_series')))
          .orderBy(direction(infiniteFeedSubquery.date), direction(infiniteFeedSubquery.mediaId)),
          
        (!cursorData && include_total_count)
          ? tx.select({ count: sql<number>`cast(count(*) as int)` })
              .from(tmdbPersonFeedView)
              .innerJoin(followPerson, eq(followPerson.personId, tmdbPersonFeedView.personId))
              .where(baseWhere)
          : Promise.resolve(undefined)
      ]);

      const totalCount = totalCountResult ? totalCountResult[0].count : undefined;
      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;
      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].feed;
        nextCursor = encodeCursor<BaseCursor<string, number>>({
          value: lastItem.date,
          id: lastItem.mediaId,
        });
      }

      return plainToInstance(ListInfinitePersonFeedDto, {
        data: paginatedResults.map(({ feed, person, movie, tvSeries }): ListInfinitePersonFeedDto['data'][number] => {
          if (feed.type === 'movie') {
            return {
              type: 'movie',
              mediaId: feed.mediaId,
              date: feed.date,
              jobs: feed.jobs,
              person,
              media: movie,
            }
          }
          return {
            type: 'tv_series',
            mediaId: feed.mediaId,
            date: feed.date,
            jobs: feed.jobs,
            person: person,
            media: tvSeries,
          }
        }),
        meta: {
          next_cursor: nextCursor,
          per_page,
          total_results: totalCount,
        },
      }, { excludeExtraneousValues: true });
    });
  }
}