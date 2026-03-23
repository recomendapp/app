import { Inject, Injectable } from '@nestjs/common';
import { Client as TypesenseClient } from 'typesense';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';
import { ListInfiniteSearchUsersQueryDto, ListPaginatedSearchUsersQueryDto } from './search-users.dto';
import { ListInfiniteUsersDto, ListPaginatedUsersDto } from '../../users/dto/users.dto';
import { plainToInstance } from 'class-transformer';
import { user, profile } from '@libs/db/schemas';
import { eq, inArray } from 'drizzle-orm';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';
import { decodeCursor, encodeCursor } from '../../../utils/cursor';
import { TYPESENSE_CLIENT } from '../../../common/modules/typesense/typesense.module';

@Injectable()
export class SearchUsersService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  private async executeTypesenseSearch(q: string, page: number, per_page: number) {
    const searchParameters = {
      q,
      query_by: 'username,name',
      page,
      per_page,
      sort_by: '_text_match(buckets: 10):desc,followers_count:desc',
    };

    return this.typesenseClient
      .collections<{ id: string }>('users')
      .documents()
      .search(searchParameters);
  }

  public async hydrateUsers(ids: string[]) {
    if (ids.length === 0) return [];

    const dbUsers = await this.db
      .select({
        user: USER_COMPACT_SELECT,
      })
      .from(user)
      .innerJoin(profile, eq(profile.id, user.id))
      .where(inArray(user.id, ids));

    const userMap = new Map(dbUsers.map((u) => [u.user.id, u.user]));
    
    return ids
        .map((id) => userMap.get(id))
        .filter(Boolean);
  }

  async listPaginated({
    currentUser,
    dto,
  }: {
    currentUser: User | null;
    dto: ListPaginatedSearchUsersQueryDto;
  }): Promise<ListPaginatedUsersDto> {
    const { q, page, per_page } = dto;

    const typesenseResult = await this.executeTypesenseSearch(q, page, per_page);
    const userIds = typesenseResult.hits?.map((hit) => hit.document.id as string) || [];
    
    const hydratedUsers = await this.hydrateUsers(userIds);

    return plainToInstance(ListPaginatedUsersDto, {
      data: hydratedUsers,
      meta: {
        total_results: typesenseResult.found,
        total_pages: Math.ceil(typesenseResult.found / per_page),
        current_page: page,
        per_page: per_page,
      },
    }, { excludeExtraneousValues: true });
  }

  async listInfinite({
    currentUser,
    dto,
  }: {
    currentUser: User | null;
    dto: ListInfiniteSearchUsersQueryDto;
  }): Promise<ListInfiniteUsersDto> {
    const { q, cursor, per_page, include_total_count } = dto;
    
    const cursorData = cursor ? decodeCursor<{ page: number }>(cursor) : { page: 1 };
    const page = cursorData.page;

    const typesenseResult = await this.executeTypesenseSearch(q, page, per_page);
    const userIds = typesenseResult.hits?.map((hit) => hit.document.id as string) || [];
    
    const hydratedUsers = await this.hydrateUsers(userIds);

    const hasNextPage = page * per_page < typesenseResult.found;
    const nextCursor = hasNextPage 
        ? encodeCursor<{ page: number }>({ page: page + 1 }) 
        : null;

    return plainToInstance(ListInfiniteUsersDto, {
      data: hydratedUsers,
      meta: {
        next_cursor: nextCursor,
        per_page,
        total_results: include_total_count ? typesenseResult.found : undefined,
      },
    }, { excludeExtraneousValues: true });
  }
}