import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { pinnedItemTypeEnum } from '@libs/db/schemas';
import { z } from 'zod';
import { MePinnedService } from './me-pinned.service';
import { McpAuthenticatedRequest } from '../../auth/types/fastify';

const pinItemParameters = z.object({
  type: z.enum(pinnedItemTypeEnum.enumValues).describe('The type of item to pin'),
  mediaId: z
    .number()
    .int()
    .describe('The TMDB id of the movie, TV series or person, or the id of the playlist'),
});

const movePinnedItemParameters = z.object({
  pinnedItemId: z.number().int().describe('The id of the pinned item (not the TMDB id)'),
  position: z.number().int().min(1).describe('The new position in the pinned list (1 is first)'),
});

const unpinItemsParameters = z.object({
  itemIds: z
    .array(z.number().int())
    .min(1)
    .describe('The ids of the pinned items to remove (not the TMDB ids)'),
});

@McpController()
export class MePinnedTool {
  constructor(private readonly mePinnedService: MePinnedService) {}

  @Tool({
    name: 'pin-item',
    description:
      'Pin a movie, TV series, person or playlist to the profile of the current user. ' +
      'Free accounts can pin 4 items, Premium accounts 10. ' +
      'Use "list-user-pinned" to see the pinned items.',
    parameters: pinItemParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
  })
  async pinItem(
    @Payload() dto: z.infer<typeof pinItemParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const item = await this.mePinnedService.add({
      currentUser: request.user,
      dto,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(item) }],
    };
  }

  @Tool({
    name: 'move-pinned-item',
    description: 'Move a pinned item to another position on the profile of the current user',
    parameters: movePinnedItemParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async movePinnedItem(
    @Payload() { pinnedItemId, position }: z.infer<typeof movePinnedItemParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const item = await this.mePinnedService.update({
      currentUser: request.user,
      pinnedItemId,
      dto: { position },
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(item) }],
    };
  }

  @Tool({
    name: 'unpin-items',
    description: 'Remove items from the pinned items of the current user',
    parameters: unpinItemsParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
    },
  })
  async unpinItems(
    @Payload() dto: z.infer<typeof unpinItemsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const items = await this.mePinnedService.delete({ currentUser: request.user, dto });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(items) }],
    };
  }
}
