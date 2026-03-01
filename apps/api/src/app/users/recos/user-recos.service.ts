import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, exists, gt, lt, or, SQL, sql } from 'drizzle-orm';
import { follow, profile, tmdbMovieView, tmdbTvSeriesView } from '@libs/db/schemas';
import { User } from '../../auth/auth.service';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle.module';
import { SupportedLocale } from '@libs/i18n';
import { SortOrder } from '../../../common/dto/sort.dto';
import { DbTransaction } from '@libs/db';
import { BaseCursor, decodeCursor, encodeCursor } from '../../../utils/cursor';
import { BaseListRecosQueryDto, ListAllRecosQueryDto, ListInfiniteRecosDto, ListInfiniteRecosQueryDto, ListPaginatedRecosDto, ListPaginatedRecosQueryDto, RecoSortBy, RecoWithMediaUnion } from '../../recos/dto/recos.dto';

@Injectable()
export class UserRecosService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
  ) {}

  /* ---------------------------------- List ---------------------------------- */
  async listAll({
    targetUserId,
    query,
    currentUser,
    locale,
  }: {
    targetUserId: string;
    query: ListAllRecosQueryDto;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<RecoWithMediaUnion[]> {
    return [];
  }
  async listPaginated({
    targetUserId,
    query,
    currentUser,
    locale,
  }: {
    targetUserId: string;
    query: ListPaginatedRecosQueryDto;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<ListPaginatedRecosDto> {
    return {
      data: [],
      meta: {
        total_pages: 0,
        total_results: 0,
        current_page: query.page,
        per_page: query.per_page,
      },
    };
  }
  async listInfinite({
    targetUserId,
    query,
    currentUser,
    locale,
  }: {
    targetUserId: string;
    query: ListInfiniteRecosQueryDto;
    currentUser: User | null;
    locale: SupportedLocale;
  }): Promise<ListInfiniteRecosDto> {
    return {
      data: [],
      meta: {
        next_cursor: null,
        per_page: query.per_page,
      },
    };
  }
}
