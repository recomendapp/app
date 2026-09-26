import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { supportedLocales } from '@libs/i18n';
import { USER_RULES } from '@libs/rules';
import { z } from 'zod';
import { MeService } from './me.service';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

const updateMeParameters = z.object({
  name: z
    .string()
    .min(USER_RULES.NAME.MIN)
    .max(USER_RULES.NAME.MAX)
    .optional()
    .describe('The display name'),
  username: z
    .string()
    .transform(USER_RULES.USERNAME.normalization)
    .pipe(z.string().regex(USER_RULES.USERNAME.REGEX, 'Invalid username'))
    .optional()
    .describe(
      `The username: ${USER_RULES.USERNAME.MIN} to ${USER_RULES.USERNAME.MAX} letters, digits, ` +
        'underscores or dots. It can only be changed once every 30 days.',
    ),
  bio: z
    .string()
    .regex(USER_RULES.BIO.REGEX, 'The bio cannot be blank or contain blank lines')
    .nullable()
    .optional()
    .describe(`The bio (${USER_RULES.BIO.MAX} characters max). Set to null to remove it`),
  isPrivate: z
    .boolean()
    .optional()
    .describe('Whether the profile is private: new followers then need to be accepted'),
  language: z.enum(supportedLocales).optional().describe('The language of the app, e.g. "fr-FR"'),
});

@McpController()
export class MeTool {
  constructor(private readonly meService: MeService) {}

  @Tool({
    name: 'whoami',
    description: 'Get the currently authenticated user for this MCP connection',
    parameters: z.object({}),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async whoami(@McpRawRequest() request: McpAuthenticatedRequest) {
    const me = await this.meService.get(request.user);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(me) }],
    };
  }

  @Tool({
    name: 'update-me',
    description: 'Update the profile and settings of the current user',
    parameters: updateMeParameters,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
  })
  async updateMe(
    @Payload() dto: z.infer<typeof updateMeParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const me = await this.meService.update(request.user, dto);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(me) }],
    };
  }
}
