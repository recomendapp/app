import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { MoviePlaylistsService } from './movie-playlists.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { PlaylistSortBy } from '../../playlists/dto/playlists.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

const listMoviePlaylistsParameters = z.object({
  movieId: z.number().int().describe('The TMDB id of the movie'),
  sortBy: z.enum(PlaylistSortBy).default(PlaylistSortBy.UPDATED_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class MoviePlaylistsTool {
  constructor(private readonly moviePlaylistsService: MoviePlaylistsService) {}

  @Tool({
    name: 'list-movie-playlists',
    description: 'List the playlists that contain a movie, visible to the current user',
    parameters: listMoviePlaylistsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listMoviePlaylists(
    @Payload()
    { movieId, sortBy, sortOrder, page, perPage }: z.infer<typeof listMoviePlaylistsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const playlists = await this.moviePlaylistsService.listPaginated({
      movieId,
      currentUser: request.user,
      query: { sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(playlists) }],
    };
  }
}
