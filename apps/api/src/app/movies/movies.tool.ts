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

  @Tool({
    name: 'get-movie-casting',
    description: 'Get the cast of a movie',
    parameters: z.object({
      movieId: z.number().int().describe('The TMDB id of the movie'),
    }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getMovieCasting(
    @Payload() { movieId }: { movieId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const casting = await this.moviesService.getCasting({
      movieId,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(casting) }],
    };
  }
}
