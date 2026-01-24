import { Inject, Injectable } from '@nestjs/common';
import { SupabaseUserClient } from 'apps/gateway/src/common/supabase/supabase-user-client';
import { TYPESENSE_CLIENT } from 'apps/gateway/src/common/typesense/typesense.module';
import { Client as TypesenseClient } from 'typesense';
import { SearchPlaylistsResponse } from './dto/search-playlists-response.dto';
import { SearchPlaylistsQueryDto } from './dto/search-playlists-query.dto';

@Injectable()
export class PlaylistsSearchService {
  constructor(
    private readonly supabaseClient: SupabaseUserClient,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  async search({
    q: query,
    page = 1,
    per_page = 10,
    sort_by = 'created_at',
    userId,
  }: SearchPlaylistsQueryDto & {
    userId?: string;
  }): Promise<SearchPlaylistsResponse> {
    const sortOrder = `${sort_by}:desc`;

    const searchParameters = {
      q: query,
      query_by: 'title,description',
      page: page,
      per_page: per_page,
      filter_by: this.getPlaylistPermissionFilter(userId),
      sort_by: `_text_match(buckets: 10):desc,${sortOrder}`,
    };

    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('playlists')
      .documents()
      .search(searchParameters);

    const playlistIds =
      typesenseResult.hits?.map((hit) => hit.document.id) || [];

    if (!playlistIds || playlistIds.length === 0) {
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

    const hydratedPlaylists = await this.hydratePlaylists(
      playlistIds.map((id) => parseInt(id, 10)),
    );

    const playlistMap = new Map(
      hydratedPlaylists.map((p) => [String(p.id), p]),
    );
    const sortedPlaylists = playlistIds
      .map((id) => playlistMap.get(id))
      .filter(Boolean) as typeof hydratedPlaylists;

    return {
      data: sortedPlaylists,
      pagination: {
        total_results: typesenseResult.found,
        total_pages: Math.ceil(typesenseResult.found / per_page),
        current_page: page,
        per_page: per_page,
      },
    };
  }

  private getPlaylistPermissionFilter = (userId?: string): string => {
    return userId
      ? `is_private:false || owner_id:=${userId} || guest_ids:=${userId}`
      : 'is_private:false';
  };

  private async hydratePlaylists(ids: number[]) {
    if (ids.length === 0) return [];

    const { data, error } = await this.supabaseClient
      .from('playlists')
      .select('*, user:profile(*)')
      .in('id', ids);

    if (error) throw new Error(`Failed to hydrate playlists: ${error.message}`);

    return data;
  }
}
