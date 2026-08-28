import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ImportSourcesService } from './import-sources.service';
import { ImportSourceDto } from './import-sources.dto';

@ApiTags('Imports')
@Controller({ path: 'imports/sources', version: '1' })
export class ImportSourcesController {
  constructor(private readonly importSourcesService: ImportSourcesService) {}

  @Get()
  @ApiOkResponse({
    type: [ImportSourceDto],
    description: 'Get all available import sources as a raw array',
  })
  async listAll(): Promise<ImportSourceDto[]> {
    return this.importSourcesService.listAll();
  }
}
