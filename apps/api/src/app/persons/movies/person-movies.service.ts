import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { DbTransaction } from '@libs/db';
import { SupportedLocale } from '@libs/i18n';
import { MovieSortBy } from '../../movies/dto/movies.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { and, asc, desc, eq, gt, isNotNull, lt, or, SQL, sql } from 'drizzle-orm';
import { tmdbMovieCredit, tmdbMovieView } from '@libs/db/schemas';
import { ListInfinitePersonMoviesDto, ListInfinitePersonMoviesQueryDto, ListPersonMovieQueryDto, ListPersonMoviesDto, PersonMovieFacetsDto } from './dto/person-movie.dto';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';

@Injectable()
export class PersonMoviesService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  /* ---------------------------------- List ---------------------------------- */
  private getFilteredCreditsSubquery(
    tx: DbTransaction,
    personId: number,
    department?: string,
    job?: string,
  ) {
    const creditConditions: SQL[] = [eq(tmdbMovieCredit.personId, personId)];
    
    if (department) creditConditions.push(eq(tmdbMovieCredit.department, department));
    if (job) creditConditions.push(eq(tmdbMovieCredit.job, job));

    return tx.selectDistinct({ movieId: tmdbMovieCredit.movieId })
      .from(tmdbMovieCredit)
      .where(and(...creditConditions))
      .as('filtered_credits');
  }
  private getOrderBy(sortBy: MovieSortBy, sortOrder: SortOrder) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    switch (sortBy) {
      case MovieSortBy.VOTE_AVERAGE:
        return [direction(tmdbMovieView.voteAverage), direction(tmdbMovieView.id)];
      case MovieSortBy.POPULARITY:
        return [direction(tmdbMovieView.popularity), direction(tmdbMovieView.id)];
      case MovieSortBy.RELEASE_DATE:
      default:
        return [direction(tmdbMovieView.releaseDate), direction(tmdbMovieView.id)];
    }
  }
  async list({
    personId,
    query,
    locale,
  }: {
    personId: number;
    query: ListPersonMovieQueryDto;
    locale: SupportedLocale;
  }): Promise<ListPersonMoviesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, page, sort_by, sort_order, department, job } = query;
      const offset = (page - 1) * per_page;

      const orderBy = this.getOrderBy(sort_by, sort_order);
      const filteredCreditsSq = this.getFilteredCreditsSubquery(tx, personId, department, job);

      const paginatedSubquery = tx.select({ id: tmdbMovieView.id })
        .from(filteredCreditsSq)
        .innerJoin(tmdbMovieView, eq(tmdbMovieView.id, filteredCreditsSq.movieId))
        .where(isNotNull(tmdbMovieView.releaseDate))
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset)
        .as('paginated_movies');

      const [results, totalCountResult] = await Promise.all([        
        tx.select({
            movie: {
              id: tmdbMovieView.id,
              title: tmdbMovieView.title,
              slug: tmdbMovieView.slug,
              url: tmdbMovieView.url,
              posterPath: tmdbMovieView.posterPath,
              backdropPath: tmdbMovieView.backdropPath,
              directors: tmdbMovieView.directors,
              releaseDate: tmdbMovieView.releaseDate,
              voteAverage: tmdbMovieView.voteAverage,
              voteCount: tmdbMovieView.voteCount,
              popularity: tmdbMovieView.popularity,
              genres: tmdbMovieView.genres,
              followerAvgRating: tmdbMovieView.followerAvgRating,
            },
            credits: sql<Pick<typeof tmdbMovieCredit.$inferSelect, 'department' | 'job'>[]>`(
              SELECT json_agg(json_build_object('department', mc.department, 'job', mc.job))
              FROM ${tmdbMovieCredit} mc
              WHERE mc.movie_id = ${tmdbMovieView.id} AND mc.person_id = ${personId}
            )`.as('credits')
          })
          .from(paginatedSubquery)
          .innerJoin(tmdbMovieView, eq(tmdbMovieView.id, paginatedSubquery.id))
          .orderBy(...orderBy),
          
        tx.select({ count: sql<number>`count(*)` })
          .from(filteredCreditsSq)
          .innerJoin(tmdbMovieView, eq(tmdbMovieView.id, filteredCreditsSq.movieId))
          .where(isNotNull(tmdbMovieView.releaseDate))
      ]);

      const totalCount = Number(totalCountResult[0]?.count || 0);

      return {
        data: results.map((row) => ({
          movie: row.movie,
          credits: row.credits || [],
        })),
        meta: {
          total_results: totalCount,
          total_pages: Math.ceil(totalCount / per_page),
          current_page: page,
          per_page,
        }
      }
    });
  }
  async listInfinite({
    personId,
    query,
    locale,
  }: {
    personId: number;
    query: ListInfinitePersonMoviesQueryDto;
    locale: SupportedLocale;
  }): Promise<ListInfinitePersonMoviesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, sort_order, sort_by, cursor, department, job } = query;

      const cursorData = cursor ? decodeCursor<BaseCursor<string | number, number>>(cursor) : null;

      const orderBy = this.getOrderBy(sort_by, sort_order);
      const filteredCreditsSq = this.getFilteredCreditsSubquery(tx, personId, department, job);

      let cursorWhereClause: SQL | undefined;

      if (cursorData) {
        const operator = sort_order === SortOrder.ASC ? gt : lt;

        switch (sort_by) {
          case MovieSortBy.VOTE_AVERAGE:
            cursorWhereClause = or(
              operator(tmdbMovieView.voteAverage, Number(cursorData.value)),
              and(
                eq(tmdbMovieView.voteAverage, Number(cursorData.value)),
                operator(tmdbMovieView.id, cursorData.id)
              )
            );
            break;
          
          case MovieSortBy.POPULARITY:
            cursorWhereClause = or(
              operator(tmdbMovieView.popularity, Number(cursorData.value)),
              and(
                eq(tmdbMovieView.popularity, Number(cursorData.value)),
                operator(tmdbMovieView.id, cursorData.id)
              )
            );
            break;

          case MovieSortBy.RELEASE_DATE:
          default: {
            cursorWhereClause = or(
              operator(tmdbMovieView.releaseDate, cursorData.value as string),
              and(
                eq(tmdbMovieView.releaseDate, cursorData.value as string),
                operator(tmdbMovieView.id, cursorData.id)
              )
            );
            break;
          }
        }
      }

      const baseWhereClause = isNotNull(tmdbMovieView.releaseDate);
      const finalWhereClause = cursorWhereClause 
        ? and(baseWhereClause, cursorWhereClause) 
        : baseWhereClause;

      const fetchLimit = per_page + 1;

      const paginatedSubquery = tx.select({ id: tmdbMovieView.id })
        .from(filteredCreditsSq)
        .innerJoin(tmdbMovieView, eq(tmdbMovieView.id, filteredCreditsSq.movieId))
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit)
        .as('paginated_movies');
      
      const results = await tx.select({
          movie: {
            id: tmdbMovieView.id,
            title: tmdbMovieView.title,
            slug: tmdbMovieView.slug,
            url: tmdbMovieView.url,
            posterPath: tmdbMovieView.posterPath,
            backdropPath: tmdbMovieView.backdropPath,
            directors: tmdbMovieView.directors,
            releaseDate: tmdbMovieView.releaseDate,
            voteAverage: tmdbMovieView.voteAverage,
            voteCount: tmdbMovieView.voteCount,
            popularity: tmdbMovieView.popularity,
            genres: tmdbMovieView.genres,
            followerAvgRating: tmdbMovieView.followerAvgRating,
          },
          credits: sql<Pick<typeof tmdbMovieCredit.$inferSelect, 'department' | 'job'>[]>`(
            SELECT json_agg(json_build_object('department', mc.department, 'job', mc.job))
            FROM ${tmdbMovieCredit} mc
            WHERE mc.movie_id = ${tmdbMovieView.id} AND mc.person_id = ${personId}
          )`.as('credits')
        })
        .from(paginatedSubquery)
        .innerJoin(tmdbMovieView, eq(tmdbMovieView.id, paginatedSubquery.id))
        .orderBy(...orderBy);
      
      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;

      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].movie;
        let cursorValue: string | number | null = null;

        switch (sort_by) {
          case MovieSortBy.VOTE_AVERAGE:
            cursorValue = lastItem.voteAverage ?? 0;
            break;
          case MovieSortBy.POPULARITY:
            cursorValue = lastItem.popularity ?? 0;
            break;
          case MovieSortBy.RELEASE_DATE:
          default:
            cursorValue = lastItem.releaseDate;
            break;
        }

        if (cursorValue !== null) {
          nextCursor = encodeCursor<BaseCursor<string | number, number>>({
            value: cursorValue,
            id: lastItem.id,
          });
        }
      }

      return {
        data: paginatedResults.map((row) => ({
          movie: row.movie,
          credits: row.credits || [],
        })),
        meta: {
          next_cursor: nextCursor,
          per_page,
        }
      }
    });
  }
  // Facets
  async getFacets({
    personId,
  }: {
    personId: number;
  }): Promise<PersonMovieFacetsDto> {
    const uniqueCredits = await this.db
      .selectDistinct({
        department: tmdbMovieCredit.department,
        job: tmdbMovieCredit.job,
      })
      .from(tmdbMovieCredit)
      .where(eq(tmdbMovieCredit.personId, personId));

    const departmentsMap = new Map<string, Set<string>>();

    for (const credit of uniqueCredits) {
      if (!departmentsMap.has(credit.department)) {
        departmentsMap.set(credit.department, new Set());
      }
      departmentsMap.get(credit.department).add(credit.job);
    }

    const departments = Array.from(departmentsMap.entries())
      .map(([department, jobsSet]) => ({
        department,
        jobs: Array.from(jobsSet).sort(),
      }))
      .sort((a, b) => a.department.localeCompare(b.department));

    return { departments };
  }
}
