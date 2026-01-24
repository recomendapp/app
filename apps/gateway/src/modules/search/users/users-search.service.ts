import { Inject, Injectable } from '@nestjs/common';
import { SupabaseUserClient } from 'apps/gateway/src/common/supabase/supabase-user-client';
import { TYPESENSE_CLIENT } from 'apps/gateway/src/common/typesense/typesense.module';
import { Client as TypesenseClient } from 'typesense';
import { SearchUsersResponse } from './dto/search-users-response.dto';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { SearchParams } from 'typesense/lib/Typesense/Types';

@Injectable()
export class UsersSearchService {
  constructor(
    private readonly supabaseClient: SupabaseUserClient,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  async search({
    q: query,
    page = 1,
    per_page = 10,
    exclude_ids,
  }: SearchUsersQueryDto): Promise<SearchUsersResponse> {
    const searchParameters: SearchParams<{ id: string }> = {
      q: query,
      query_by: 'username,full_name',
      page: page,
      per_page: per_page,
      sort_by: '_text_match(buckets: 10):desc, followers_count:desc',
    };

    if (exclude_ids && exclude_ids.length > 0) {
      const idsToExclude = exclude_ids.split(',');
      const exclusionFilter = idsToExclude
        .map((id) => `id:!=${id}`)
        .join(' && ');
      searchParameters.filter_by = exclusionFilter;
    }

    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('users')
      .documents()
      .search(searchParameters);

    const userIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];

    if (!userIds || userIds.length === 0) {
      return {
        data: [],
        pagination: {
          total_results: 0,
          total_pages: 0,
          current_page: page,
          per_page: per_page,
        },
      };
    }

    const hydratedUsers = await this.hydrateUsers(userIds);

    const userMap = new Map(hydratedUsers.map((u) => [String(u.id), u]));
    const sortedUsers = userIds
      .map((id) => userMap.get(id))
      .filter(Boolean) as typeof hydratedUsers;

    return {
      data: sortedUsers,
      pagination: {
        total_results: typesenseResult.found,
        total_pages: Math.ceil(typesenseResult.found / per_page),
        current_page: page,
        per_page: per_page,
      },
    };
  }

  private async hydrateUsers(ids: string[]) {
    if (ids.length === 0) return [];

    const { data, error } = await this.supabaseClient
      .from('profile')
      .select('*')
      .in('id', ids);

    if (error) throw new Error(`Failed to hydrate users: ${error.message}`);

    return data;
  }
}
