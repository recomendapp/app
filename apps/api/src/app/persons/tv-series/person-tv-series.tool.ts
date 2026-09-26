import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { PersonTvSeriesService } from './person-tv-series.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { TvSeriesSortBy } from '../../tv-series/dto/tv-series.dto';
import { SortOrder } from '../../../common/dto/sort.dto';

const personIdParameter = z.number().int().describe('The TMDB id of the person');

const listPersonTvSeriesParameters = z.object({
  personId: personIdParameter,
  department: z
    .string()
    .optional()
    .describe(
      'Filter by department, e.g. "Acting" or "Directing" (see "get-person-tv-series-facets")',
    ),
  job: z
    .string()
    .optional()
    .describe('Filter by job, e.g. "Director" or "Screenplay" (see "get-person-tv-series-facets")'),
  sortBy: z.enum(TvSeriesSortBy).default(TvSeriesSortBy.LAST_AIR_DATE).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class PersonTvSeriesTool {
  constructor(private readonly personTvSeriesService: PersonTvSeriesService) {}

  @Tool({
    name: 'list-person-tv-series',
    description:
      'List the TV series a person worked on, with their credits (department and job). ' +
      'Filter by department or job to get e.g. only the TV series they directed.',
    parameters: listPersonTvSeriesParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listPersonTvSeries(
    @Payload()
    {
      personId,
      department,
      job,
      sortBy,
      sortOrder,
      page,
      perPage,
    }: z.infer<typeof listPersonTvSeriesParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.personTvSeriesService.listPaginated({
      personId,
      query: { department, job, sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }

  @Tool({
    name: 'get-person-tv-series-facets',
    description:
      'List the departments and jobs a person has in TV series, ' +
      'to use as filters of "list-person-tv-series"',
    parameters: z.object({ personId: personIdParameter }),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getPersonTvSeriesFacets(@Payload() { personId }: { personId: number }) {
    const facets = await this.personTvSeriesService.getFacets({ personId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(facets) }],
    };
  }
}
