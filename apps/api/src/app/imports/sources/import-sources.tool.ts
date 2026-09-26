import { McpController, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { ImportSourcesService } from './import-sources.service';

@McpController()
export class ImportSourcesTool {
  constructor(private readonly importSourcesService: ImportSourcesService) {}

  @Tool({
    name: 'list-import-sources',
    description:
      'List the services the user can import data from (Letterboxd, IMDb, ...), with the ' +
      'instructions to export their data there and the accepted file types. The file itself ' +
      'is uploaded from the Recomend app.',
    parameters: z.object({}),
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
    },
  })
  async listImportSources() {
    const sources = await this.importSourcesService.listAll();

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(sources) }],
    };
  }
}
