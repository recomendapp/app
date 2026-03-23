import { Inject, Injectable } from '@nestjs/common';
import { Client as TypesenseClient } from 'typesense';
import { DRIZZLE_SERVICE, DrizzleService } from '../../../common/modules/drizzle/drizzle.module';
import { User } from '../../auth/auth.service';
import { plainToInstance } from 'class-transformer';
import { playlist, user, profile, follow } from '@libs/db/schemas';
import { and, eq, inArray } from 'drizzle-orm';
import { decodeCursor, encodeCursor } from '../../../utils/cursor';
import { TYPESENSE_CLIENT } from '../../../common/modules/typesense/typesense.module';
import { ListInfiniteSearchPlaylistsQueryDto, ListPaginatedSearchPlaylistsQueryDto } from './search-playlists.dto';
import { ListInfinitePlaylistsWithOwnerDto, ListPaginatedPlaylistsWithOwnerDto } from '../../playlists/dto/playlists.dto';
import { PlaylistQueryBuilder } from '../../playlists/playlists.query-builder';
import { USER_COMPACT_SELECT } from '@libs/db/selectors';

@Injectable()
export class SearchPlaylistsService {
  constructor(
    @Inject(DRIZZLE_SERVICE) private readonly db: DrizzleService,
    @Inject(TYPESENSE_CLIENT) private readonly typesenseClient: TypesenseClient,
  ) {}

  public async buildFilterBy(currentUser: User | null): Promise<string> {
    if (!currentUser) {
      return 'visibility:=public';
    }

    const followingRows = await this.db
      .select({ followingId: follow.followingId })
      .from(follow)
      .where(
        and(
          eq(follow.followerId, currentUser.id),
          eq(follow.status, 'accepted')
        )
      );
    
    const followingIds = followingRows.map(row => row.followingId);

    const conditions = [
      'visibility:=public',
      `owner_id:=${currentUser.id}`,
      `member_ids:=${currentUser.id}`,
    ];

    if (followingIds.length > 0) {
      conditions.push(`(visibility:=followers && owner_id:=[${followingIds.join(',')}])`);
    }

    return conditions.join(' || ');
  }

  private async executeTypesenseSearch(q: string, page: number, per_page: number, filterBy: string) {
    const searchParameters = {
      q,
      query_by: 'title,description',
      filter_by: filterBy,
      page,
      per_page,
      sort_by: '_text_match(buckets: 10):desc,likes_count:desc', 
    };

    return this.typesenseClient
      .collections<{ id: string }>('playlists')
      .documents()
      .search(searchParameters);
  }

  public async hydratePlaylists(ids: string[], currentUser: User | null) {
    if (ids.length === 0) return [];

    const numericIds = ids.map(Number);

    const dbPlaylists = await this.db
      .select({
        playlist: playlist,
        role: PlaylistQueryBuilder.getRoleSelection(currentUser),
        owner: USER_COMPACT_SELECT,
      })
      .from(playlist)
      .innerJoin(user, eq(user.id, playlist.userId))
      .innerJoin(profile, eq(profile.id, user.id))
      .where(inArray(playlist.id, numericIds));

    const playlistMap = new Map(dbPlaylists.map((p) => [String(p.playlist.id), p]));
    
    return ids
        .map((id) => playlistMap.get(id))
        .filter(Boolean);
  }

  async listPaginated({
    currentUser,
    dto,
  }: {
    currentUser: User | null;
    dto: ListPaginatedSearchPlaylistsQueryDto;
  }): Promise<ListPaginatedPlaylistsWithOwnerDto> {
    const { q, page, per_page } = dto;

    const filterBy = await this.buildFilterBy(currentUser);
    const typesenseResult = await this.executeTypesenseSearch(q, page, per_page, filterBy);
    const playlistIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];
    
    const hydratedPlaylists = await this.hydratePlaylists(playlistIds, currentUser);

    return plainToInstance(ListPaginatedPlaylistsWithOwnerDto, {
      data: hydratedPlaylists.map(row => ({
        ...row.playlist,
        role: row.role,
        owner: row.owner,
      })),
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
    dto: ListInfiniteSearchPlaylistsQueryDto;
  }): Promise<ListInfinitePlaylistsWithOwnerDto> {
    const { q, cursor, per_page, include_total_count } = dto;
    
    const cursorData = cursor ? decodeCursor<{ page: number }>(cursor) : { page: 1 };
    const page = cursorData.page;

    const filterBy = await this.buildFilterBy(currentUser);
    const typesenseResult = await this.executeTypesenseSearch(q, page, per_page, filterBy);
    const playlistIds = typesenseResult.hits?.map((hit) => hit.document.id) || [];
    
    const hydratedPlaylists = await this.hydratePlaylists(playlistIds, currentUser);

    const hasNextPage = page * per_page < typesenseResult.found;
    const nextCursor = hasNextPage 
        ? encodeCursor<{ page: number }>({ page: page + 1 }) 
        : null;

    return plainToInstance(ListInfinitePlaylistsWithOwnerDto, {
      data: hydratedPlaylists.map(row => ({
        ...row.playlist,
        role: row.role,
        owner: row.owner,
      })),
      meta: {
        next_cursor: nextCursor,
        per_page,
        total_results: include_total_count ? typesenseResult.found : undefined,
      },
    }, { excludeExtraneousValues: true });
  }
}