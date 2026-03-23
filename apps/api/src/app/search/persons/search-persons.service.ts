import { Inject, Injectable } from '@nestjs/common';
import { Client as TypesenseClient } from 'typesense';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';
import { TYPESENSE_CLIENT } from '../../../common/modules/typesense/typesense.module';
import { SupportedLocale } from '@libs/i18n';
import { 
  ListInfinitePersonsDto, 
  ListPaginatedPersonsDto, 
  PersonCompactDto 
} from '../../persons/dto/persons.dto';
import { 
  BaseSearchPersonsQueryDto, 
  ListInfiniteSearchPersonsQueryDto, 
  ListPaginatedSearchPersonsQueryDto 
} from './search-persons.dto';
import { decodeCursor, encodeCursor } from '../../../utils/cursor';
import { inArray, sql } from 'drizzle-orm';
import { tmdbPersonView } from '@libs/db/schemas';
import { SearchParams } from 'typesense/lib/Typesense/Documents';
import { DbTransaction } from '@libs/db';
import { PERSON_COMPACT_SELECT } from '@libs/db/selectors';

@Injectable()
export class SearchPersonsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  private buildTypesenseParams(
    page: number, 
    per_page: number, 
    dto: BaseSearchPersonsQueryDto
  ): SearchParams<{ id: string }> {
    const { q } = dto;

    const searchParameters: SearchParams<{ id: string }> = {
      q,
      query_by: 'name,also_known_as', 
      page,
      per_page,
      sort_by: '_text_match(buckets: 10):desc,popularity:desc',
    };

    return searchParameters;
  }

  public async hydratePersons(
    tx: DbTransaction, 
    ids: string[]
  ): Promise<PersonCompactDto[]> {
    if (ids.length === 0) return [];

    const numericIds = ids.map(Number);

    const dbPersons = await tx
      .select(PERSON_COMPACT_SELECT)
      .from(tmdbPersonView)
      .where(inArray(tmdbPersonView.id, numericIds));

    const personMap = new Map(dbPersons.map((p) => [String(p.id), p]));
    
    return ids
        .map((id) => personMap.get(id))
        .filter((person): person is PersonCompactDto => Boolean(person));
  }

  async listPaginated({
    currentUser,
    locale,
    dto,
  }: {
    currentUser: User | null;
    locale: SupportedLocale;
    dto: ListPaginatedSearchPersonsQueryDto;
  }): Promise<ListPaginatedPersonsDto> {
    const { page, per_page } = dto;

    const params = this.buildTypesenseParams(page, per_page, dto);
    
    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('persons') 
      .documents()
      .search(params);
      
    const personIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];
    
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const hydratedPersons = await this.hydratePersons(tx, personIds);

      return {
        data: hydratedPersons,
        meta: {
          total_results: typesenseResult.found,
          total_pages: Math.ceil(typesenseResult.found / per_page),
          current_page: page,
          per_page: per_page,
        },
      };
    });
  }

  async listInfinite({
    currentUser,
    locale,
    dto,
  }: {
    currentUser: User | null;
    locale: SupportedLocale;
    dto: ListInfiniteSearchPersonsQueryDto;
  }): Promise<ListInfinitePersonsDto> {
    const { cursor, per_page, include_total_count } = dto;
    
    const cursorData = cursor ? decodeCursor<{ page: number }>(cursor) : { page: 1 };
    const page = cursorData.page;

    const params = this.buildTypesenseParams(page, per_page, dto);
    
    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('persons')
      .documents()
      .search(params);

    const personIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];
    
    return await this.db.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.current_language', ${locale}, true)`);
      if (currentUser) {
        await tx.execute(sql`SELECT set_config('app.current_user_id', ${currentUser.id}, true)`);
      }

      const hydratedPersons = await this.hydratePersons(tx, personIds);

      const hasNextPage = page * per_page < typesenseResult.found;
      const nextCursor = hasNextPage 
          ? encodeCursor<{ page: number }>({ page: page + 1 }) 
          : null;

      return {
        data: hydratedPersons,
        meta: {
          next_cursor: nextCursor,
          per_page,
          total_results: include_total_count ? typesenseResult.found : undefined,
        },
      };
    });
  }
}