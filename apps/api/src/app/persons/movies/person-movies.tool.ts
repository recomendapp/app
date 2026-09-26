import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { PersonMoviesService } from './person-movies.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { MovieSortBy } from '../../movies/dto/movies.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

const personIdParameter = z.number().int().describe('The TMDB id of the person');

const listPersonMoviesParameters = z.object({
  personId: personIdParameter,
  department: z
    .string()
    .optional()
    .describe(
      'Filter by department, e.g. "Acting" or "Directing" (see "get-person-movies-facets")',
    ),
  job: z
    .string()
    .optional()
    .describe('Filter by job, e.g. "Director" or "Screenplay" (see "get-person-movies-facets")'),
  sortBy: z.enum(MovieSortBy).default(MovieSortBy.RELEASE_DATE).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class PersonMoviesTool {
  constructor(private readonly personMoviesService: PersonMoviesService) {}

  @Tool({
    name: 'list-person-movies',
    description:
      'List the movies a person worked on, with their credits (department and job). ' +
      'Filter by department or job to get e.g. only the movies they directed.',
    parameters: listPersonMoviesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listPersonMovies(
    @Payload()
    {
      personId,
      department,
      job,
      sortBy,
      sortOrder,
      page,
      perPage,
    }: z.infer<typeof listPersonMoviesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.personMoviesService.listPaginated({
      personId,
      query: { department, job, sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }

  @Tool({
    name: 'get-person-movies-facets',
    description:
      'List the departments and jobs a person has in movies, ' +
      'to use as filters of "list-person-movies"',
    parameters: z.object({ personId: personIdParameter }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getPersonMoviesFacets(@Payload() { personId }: { personId: number }) {
    const facets = await this.personMoviesService.getFacets({ personId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(facets) }],
    };
  }
}
