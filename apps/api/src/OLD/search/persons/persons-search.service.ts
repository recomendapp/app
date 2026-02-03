import { Inject, Injectable } from '@nestjs/common';
import { Client as TypesenseClient } from 'typesense';
import { SearchPersonsResponse } from './dto/search-persons-response.dto';
import { SearchPersonsQueryDto } from './dto/search-persons-query.dto';
import { SupabaseUserClient } from '../../common/supabase/supabase-user-client';
import { TYPESENSE_CLIENT } from '@libs/core';

@Injectable()
export class PersonsSearchService {
  constructor(
    private readonly supabaseClient: SupabaseUserClient,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  async search({
    q: query,
    page = 1,
    per_page = 10,
    sort_by = 'popularity',
  }: SearchPersonsQueryDto): Promise<SearchPersonsResponse> {
    const sortOrder = `${sort_by}:desc`;

    const searchParameters = {
      q: query,
      query_by: 'name,also_known_as',
      page: page,
      per_page: per_page,
      sort_by: `_text_match:desc,${sortOrder}`,
    };

    const typesenseResult = await this.typesenseClient
      .collections<{ id: string }>('persons')
      .documents()
      .search(searchParameters);

    const personIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];

    if (!personIds || personIds.length === 0) {
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

    const hydratedPersons = await this.hydratePersons(
      personIds.map((id) => parseInt(id, 10)),
    );

    const personMap = new Map(hydratedPersons.map((p) => [String(p.id), p]));
    const sortedPersons = personIds
      .map((id) => personMap.get(id))
      .filter(Boolean) as typeof hydratedPersons;

    return {
      data: sortedPersons,
      pagination: {
        total_results: typesenseResult.found,
        total_pages: Math.ceil(typesenseResult.found / per_page),
        current_page: page,
        per_page: per_page,
      },
    };
  }

  private async hydratePersons(ids: number[]) {
    if (ids.length === 0) return [];

    const { data, error } = await this.supabaseClient
      .from('media_person')
      .select('*')
      .in('id', ids);

    if (error) throw new Error(`Failed to hydrate persons: ${error.message}`);

    return data;
  }
}
