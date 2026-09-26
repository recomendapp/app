import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { SearchPersonsService } from './search-persons.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const searchPersonsParameters = z.object({
  q: z.string().min(1).describe('The search query, e.g. a person name'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(10).describe('Number of results per page'),
});

@McpController()
export class SearchPersonsTool {
  constructor(private readonly searchPersonsService: SearchPersonsService) {}

  @Tool({
    name: 'search-persons',
    description:
      'Search persons only (actors, directors, crew members). ' +
      'Prefer the "search" tool when the kind of item is unknown.',
    parameters: searchPersonsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async searchPersons(
    @Payload() { q, page, perPage }: z.infer<typeof searchPersonsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const persons = await this.searchPersonsService.listPaginated({
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
      dto: { q, page, per_page: perPage },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(persons) }],
    };
  }
}
