import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { DbTransaction } from '@libs/db';
import { SupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import { and, asc, desc, eq, gt, isNotNull, lt, or, SQL, sql } from 'drizzle-orm';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { tmdbTvSeriesCredit, tmdbTvSeriesView } from '@libs/db/schemas';
import { TvSeriesSortBy } from '../../tv-series/dto/tv-series.dto';
import { ListInfinitePersonTvSeriesDto, ListInfinitePersonTvSeriesQueryDto, ListPersonTvSeriesDto, ListPersonTvSeriesQueryDto, PersonTvSeriesFacetsDto } from './dto/person-tv-series.dto';

@Injectable()
export class PersonTvSeriesService {
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
    const creditConditions: SQL[] = [eq(tmdbTvSeriesCredit.personId, personId)];
    
    if (department) creditConditions.push(eq(tmdbTvSeriesCredit.department, department));
    if (job) creditConditions.push(eq(tmdbTvSeriesCredit.job, job));

    return tx.selectDistinct({ tvSeriesId: tmdbTvSeriesCredit.tvSeriesId })
      .from(tmdbTvSeriesCredit)
      .where(and(...creditConditions))
      .as('filtered_credits'); 
  }
  private getOrderBy(sortBy: TvSeriesSortBy, sortOrder: SortOrder) {
    const direction = sortOrder === SortOrder.ASC ? asc : desc;
    switch (sortBy) {
      case TvSeriesSortBy.VOTE_AVERAGE:
        return [direction(tmdbTvSeriesView.voteAverage), direction(tmdbTvSeriesView.id)];
      case TvSeriesSortBy.POPULARITY:
        return [direction(tmdbTvSeriesView.popularity), direction(tmdbTvSeriesView.id)];
      case TvSeriesSortBy.LAST_AIR_DATE:
      default:
        return [direction(tmdbTvSeriesView.lastAirDate), direction(tmdbTvSeriesView.id)];
    }
  }
  async list({
    personId,
    query,
    locale,
  }: {
    personId: number;
    query: ListPersonTvSeriesQueryDto;
    locale: SupportedLocale;
  }): Promise<ListPersonTvSeriesDto> {
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);

      const { per_page, page, sort_by, sort_order, department, job } = query;
      const offset = (page - 1) * per_page;

      const orderBy = this.getOrderBy(sort_by, sort_order);
      const filteredCreditsSq = this.getFilteredCreditsSubquery(tx, personId, department, job);

      const paginatedSubquery = tx.select({ id: tmdbTvSeriesView.id })
        .from(filteredCreditsSq)
        .innerJoin(tmdbTvSeriesView, eq(tmdbTvSeriesView.id, filteredCreditsSq.tvSeriesId))
        .where(isNotNull(tmdbTvSeriesView.lastAirDate)) // On s'assure d'avoir une date pour le tri
        .orderBy(...orderBy)
        .limit(per_page)
        .offset(offset)
        .as('paginated_tv_series');

      const [results, totalCountResult] = await Promise.all([        
        tx.select({
            tvSeries: {
              id: tmdbTvSeriesView.id,
              name: tmdbTvSeriesView.name,
              slug: tmdbTvSeriesView.slug,
              url: tmdbTvSeriesView.url,
              posterPath: tmdbTvSeriesView.posterPath,
              backdropPath: tmdbTvSeriesView.backdropPath,
              createdBy: tmdbTvSeriesView.createdBy,
              firstAirDate: tmdbTvSeriesView.firstAirDate,
              lastAirDate: tmdbTvSeriesView.lastAirDate,
              voteAverage: tmdbTvSeriesView.voteAverage,
              voteCount: tmdbTvSeriesView.voteCount,
              popularity: tmdbTvSeriesView.popularity,
              genres: tmdbTvSeriesView.genres,
              followerAvgRating: tmdbTvSeriesView.followerAvgRating,
            },
            credits: sql<Pick<typeof tmdbTvSeriesCredit.$inferSelect, 'department' | 'job'>[]>`(
              SELECT json_agg(json_build_object('department', mc.department, 'job', mc.job))
              FROM ${tmdbTvSeriesCredit} mc
              WHERE mc.tv_series_id = ${tmdbTvSeriesView.id} AND mc.person_id = ${personId}
            )`.as('credits')
          })
          .from(paginatedSubquery)
          .innerJoin(tmdbTvSeriesView, eq(tmdbTvSeriesView.id, paginatedSubquery.id))
          .orderBy(...orderBy),
          
        tx.select({ count: sql<number>`count(*)` })
          .from(filteredCreditsSq)
          .innerJoin(tmdbTvSeriesView, eq(tmdbTvSeriesView.id, filteredCreditsSq.tvSeriesId))
          .where(isNotNull(tmdbTvSeriesView.lastAirDate))
      ]);

      const totalCount = Number(totalCountResult[0]?.count || 0);

      return {
        data: results.map((row) => ({
          tvSeries: row.tvSeries,
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
    query: ListInfinitePersonTvSeriesQueryDto;
    locale: SupportedLocale;
  }): Promise<ListInfinitePersonTvSeriesDto> {
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
          case TvSeriesSortBy.VOTE_AVERAGE:
            cursorWhereClause = or(
              operator(tmdbTvSeriesView.voteAverage, Number(cursorData.value)),
              and(
                eq(tmdbTvSeriesView.voteAverage, Number(cursorData.value)),
                operator(tmdbTvSeriesView.id, cursorData.id)
              )
            );
            break;

          case TvSeriesSortBy.POPULARITY:
            cursorWhereClause = or(
              operator(tmdbTvSeriesView.popularity, Number(cursorData.value)),
              and(
                eq(tmdbTvSeriesView.popularity, Number(cursorData.value)),
                operator(tmdbTvSeriesView.id, cursorData.id)
              )
            );
            break;

          case TvSeriesSortBy.LAST_AIR_DATE:
          default: {
            cursorWhereClause = or(
              operator(tmdbTvSeriesView.lastAirDate, cursorData.value as string),
              and(
                eq(tmdbTvSeriesView.lastAirDate, cursorData.value as string),
                operator(tmdbTvSeriesView.id, cursorData.id)
              )
            );
            break;
          }
        }
      }

      const baseWhereClause = isNotNull(tmdbTvSeriesView.lastAirDate);
      const finalWhereClause = cursorWhereClause 
        ? and(baseWhereClause, cursorWhereClause) 
        : baseWhereClause;

      const fetchLimit = per_page + 1;

      const paginatedSubquery = tx.select({ id: tmdbTvSeriesView.id })
        .from(filteredCreditsSq)
        .innerJoin(tmdbTvSeriesView, eq(tmdbTvSeriesView.id, filteredCreditsSq.tvSeriesId))
        .where(finalWhereClause)
        .orderBy(...orderBy)
        .limit(fetchLimit)
        .as('paginated_tv_series');
      
      const results = await tx.select({
          tvSeries: {
            id: tmdbTvSeriesView.id,
            name: tmdbTvSeriesView.name,
            slug: tmdbTvSeriesView.slug,
            url: tmdbTvSeriesView.url,
            posterPath: tmdbTvSeriesView.posterPath,
            backdropPath: tmdbTvSeriesView.backdropPath,
            createdBy: tmdbTvSeriesView.createdBy,
            firstAirDate: tmdbTvSeriesView.firstAirDate,
            lastAirDate: tmdbTvSeriesView.lastAirDate,
            voteAverage: tmdbTvSeriesView.voteAverage,
            voteCount: tmdbTvSeriesView.voteCount,
            popularity: tmdbTvSeriesView.popularity,
            genres: tmdbTvSeriesView.genres,
            followerAvgRating: tmdbTvSeriesView.followerAvgRating,
          },
          credits: sql<Pick<typeof tmdbTvSeriesCredit.$inferSelect, 'department' | 'job'>[]>`(
            SELECT json_agg(json_build_object('department', mc.department, 'job', mc.job))
            FROM ${tmdbTvSeriesCredit} mc
            WHERE mc.tv_series_id = ${tmdbTvSeriesView.id} AND mc.person_id = ${personId}
          )`.as('credits')
        })
        .from(paginatedSubquery)
        .innerJoin(tmdbTvSeriesView, eq(tmdbTvSeriesView.id, paginatedSubquery.id))
        .orderBy(...orderBy);
      
      const hasNextPage = results.length > per_page;
      const paginatedResults = hasNextPage ? results.slice(0, per_page) : results;

      let nextCursor: string | null = null;

      if (hasNextPage) {
        const lastItem = paginatedResults[paginatedResults.length - 1].tvSeries;
        let cursorValue: string | number | null = null;

        switch (sort_by) {
          case TvSeriesSortBy.VOTE_AVERAGE:
            cursorValue = lastItem.voteAverage ?? 0;
            break;
          case TvSeriesSortBy.POPULARITY:
            cursorValue = lastItem.popularity ?? 0;
            break;
          case TvSeriesSortBy.LAST_AIR_DATE:
          default:
            cursorValue = lastItem.lastAirDate || '1970-01-01'; // Fallback de sécurité
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
          tvSeries: row.tvSeries,
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
  }): Promise<PersonTvSeriesFacetsDto> {
    const uniqueCredits = await this.db
      .selectDistinct({
        department: tmdbTvSeriesCredit.department,
        job: tmdbTvSeriesCredit.job,
      })
      .from(tmdbTvSeriesCredit)
      .where(eq(tmdbTvSeriesCredit.personId, personId));

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
