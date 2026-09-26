import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { getLocaleFromHeaders } from '@libs/i18n';
import { z } from 'zod';
import { PersonsService } from './persons.service';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

const personIdParameter = z.object({
  personId: z.number().int().describe('The TMDB id of the person'),
});

@McpController()
export class PersonsTool {
  constructor(private readonly personsService: PersonsService) {}

  @Tool({
    name: 'get-person',
    description: 'Get the details of a person (actor, director, crew member) by its TMDB id',
    parameters: personIdParameter,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getPerson(
    @Payload() { personId }: { personId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const person = await this.personsService.get({
      personId,
      currentUser: request.user,
      locale: getLocaleFromHeaders(request.headers),
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(person) }],
    };
  }

  @Tool({
    name: 'get-person-follow',
    description: 'Check whether the current user follows a person. Returns null when not followed.',
    parameters: personIdParameter,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getPersonFollow(
    @Payload() { personId }: { personId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const follow = await this.personsService.getFollowStatus(request.user.id, personId);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(follow) }],
    };
  }

  @Tool({
    name: 'follow-person',
    description: 'Follow a person, to get notified of their new movies and TV series',
    parameters: personIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async followPerson(
    @Payload() { personId }: { personId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const follow = await this.personsService.follow(request.user.id, personId);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(follow) }],
    };
  }

  @Tool({
    name: 'unfollow-person',
    description: 'Unfollow a person',
    parameters: personIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async unfollowPerson(
    @Payload() { personId }: { personId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const follow = await this.personsService.unfollow(request.user.id, personId);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(follow) }],
    };
  }
}
