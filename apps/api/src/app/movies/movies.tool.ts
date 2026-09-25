import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { MoviesService } from './movies.service';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

@McpController()
export class MoviesTool {
  constructor(private readonly moviesService: MoviesService) {}

  @Tool({
    name: 'get-movie',
    description: 'Get the details of a movie by its TMDB id',
    parameters: z.object({
      movieId: z.number().int().describe('The TMDB id of the movie'),
    }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  // No @UseGuards() here: McpHttpController's McpBearerAuthGuard already
  // authenticates every MCP request before it reaches any tool — the whole
  // server requires a logged-in user, there is no public tool.
  async getMovie(
    @Payload() { movieId }: { movieId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const movie = await this.moviesService.get({
      movieId,
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(movie) }],
    };
  }
}
