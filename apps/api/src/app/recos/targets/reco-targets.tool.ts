import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { RecoTargetsService } from './reco-targets.service';
import { RecoTargetSortBy } from './dto/reco-targets.dto';
import { RecoType } from '../dto/recos.dto';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';
import { SortOrder } from '../../../common/dto/sort.dto';

const listRecoTargetsParameters = z.object({
  type: z.enum(RecoType).describe('The type of the media'),
  mediaId: z.number().int().describe('The TMDB id of the movie or TV series'),
  search: z.string().optional().describe('Filter the users by username'),
});

@McpController()
export class RecoTargetsTool {
  constructor(private readonly recoTargetsService: RecoTargetsService) {}

  @Tool({
    name: 'list-reco-targets',
    description:
      'List the users the current user can recommend a movie or TV series to (mutual followers). ' +
      'Each user tells whether they already saw the media or already received it from the current user.',
    parameters: listRecoTargetsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listRecoTargets(
    @Payload() { type, mediaId, search }: z.infer<typeof listRecoTargetsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const targets = await this.recoTargetsService.listAll({
      currentUser: request.user,
      type,
      mediaId,
      query: { sort_by: RecoTargetSortBy.RECENTLY_SENT, sort_order: SortOrder.DESC, search },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(targets) }],
    };
  }
}
