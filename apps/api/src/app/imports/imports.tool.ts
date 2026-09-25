import { Payload } from '@nestjs/microservices';
import { McpController, McpRawRequest, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ImportsService } from './imports.service';
import { McpAuthenticatedRequest } from '../auth/types/fastify';

const importIdParameter = z.object({
  importId: z.number().int().describe('The id of the import'),
});

const listImportsParameters = z.object({
  page: z.number().int().min(1).default(1).describe('Page number'),
  perPage: z.number().int().min(1).max(50).default(20).describe('Number of results per page'),
});

// Creating an import needs a multipart file upload, which MCP tool calls cannot carry: the
// user starts it from the app, and these tools cover the review and validation that follow.
@McpController()
export class ImportsTool {
  constructor(private readonly importsService: ImportsService) {}

  @Tool({
    name: 'list-imports',
    description:
      'List the imports of the current user (Letterboxd, IMDb, ... files uploaded from the app). ' +
      'An import in "awaiting_review" status can be reviewed with the "list-import-*" and ' +
      '"update-import-*" tools, then applied with "validate-import".',
    parameters: listImportsParameters,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listImports(
    @Payload() { page, perPage }: z.infer<typeof listImportsParameters>,
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const imports = await this.importsService.listPaginated(request.user, {
      page,
      per_page: perPage,
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(imports) }],
    };
  }

  @Tool({
    name: 'get-import',
    description: 'Get the status and counters of an import of the current user',
    parameters: importIdParameter,
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async getImport(
    @Payload() { importId }: { importId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const importJob = await this.importsService.getById(request.user, importId);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(importJob) }],
    };
  }

  @Tool({
    name: 'validate-import',
    description:
      'Apply an import in "awaiting_review" status: creates the logs, reviews, bookmarks and ' +
      'playlists of every item that is matched and not skipped. Cannot be undone.',
    parameters: importIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async validateImport(
    @Payload() { importId }: { importId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    const importJob = await this.importsService.validate(request.user, importId);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(importJob) }],
    };
  }

  @Tool({
    name: 'delete-import',
    description:
      'Delete an import and its staged items. Data already applied by "validate-import" is kept.',
    parameters: importIdParameter,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
  })
  async deleteImport(
    @Payload() { importId }: { importId: number },
    @McpRawRequest() request: McpAuthenticatedRequest,
  ) {
    await this.importsService.delete(request.user, importId);

    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ deleted: true }) }],
    };
  }
}
