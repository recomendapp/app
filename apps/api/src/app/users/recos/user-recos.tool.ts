import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { recoStatusEnum, recoTypeEnum } from '@libs/db/schemas';
import { RecoSortBy } from '../../recos/dto/recos.dto';
import { SortOrder } from '../../../common/dto/sort.dto';
import { z } from 'zod';
import { UserRecosService } from './user-recos.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const userRecosParameters = z.object({
  userId: z.uuid().optional().describe('The id of the user. Defaults to the current user'),
  status: z.enum(recoStatusEnum.enumValues).default('active').describe('Reco status'),
  type: z.enum(recoTypeEnum.enumValues).optional().describe('Only return movies or TV series'),
  sortBy: z.enum(RecoSortBy).default(RecoSortBy.LAST_SEND_AT).describe('Sort field'),
  sortOrder: z.enum(SortOrder).default(SortOrder.DESC).describe('Sort order'),
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

@McpController()
export class UserRecosTool {
  constructor(private readonly userRecosService: UserRecosService) {}

  @Tool({
    name: 'list-user-recos',
    description:
      'List the recommendations a user received, grouped by movie or TV series with their senders',
    parameters: userRecosParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listUserRecos(
    @Payload()
    { userId, status, type, sortBy, sortOrder, page, perPage }: z.infer<typeof userRecosParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.userRecosService.listPaginated({
      targetUserId: userId ?? request.user.id,
      query: { status, type, sort_by: sortBy, sort_order: sortOrder, page, per_page: perPage },
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }
}
