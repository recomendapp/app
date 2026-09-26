import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { RecosService } from './recos.service';
import { RecoType } from './dto/recos.dto';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

const recoMediaParameters = z.object({
  type: z.enum(RecoType).describe('The type of the media'),
  mediaId: z.number().int().describe('The TMDB id of the movie or TV series'),
});

const sendRecoParameters = recoMediaParameters.extend({
  userIds: z
    .array(z.uuid())
    .min(1)
    .describe('The ids of the users to recommend the media to (see "list-reco-targets")'),
  comment: z.string().max(180).nullable().optional().describe('Optional message for the receivers'),
});

@McpController()
export class RecosTool {
  constructor(private readonly recosService: RecosService) {}

  @Tool({
    name: 'send-reco',
    description:
      'Recommend a movie or TV series to some users. ' +
      'Only mutual followers who have not logged the media yet receive it: ' +
      'use "list-reco-targets" to find valid receivers first.',
    parameters: sendRecoParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async sendReco(
    @Payload() { type, mediaId, ...dto }: z.infer<typeof sendRecoParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const result = await this.recosService.send({ user: request.user, type, mediaId, dto });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }],
    };
  }

  @Tool({
    name: 'delete-received-recos',
    description:
      'Dismiss all the active recommendations the current user received for a movie or TV series',
    parameters: recoMediaParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
    },
  })
  async deleteReceivedRecos(
    @Payload() { type, mediaId }: z.infer<typeof recoMediaParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const recos = await this.recosService.deleteByMedia({ user: request.user, type, mediaId });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(recos) }],
    };
  }

  @Tool({
    name: 'delete-reco',
    description:
      'Delete a recommendation by its id. The sender deletes it for everyone, ' +
      'the receiver only dismisses it.',
    parameters: z.object({ recoId: z.number().int().describe('The id of the reco') }),
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteReco(
    @Payload() { recoId }: { recoId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const reco = await this.recosService.deleteById({ id: recoId, user: request.user });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(reco) }],
    };
  }
}
