import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ExportSourcesService } from './export-sources.service';
import { ImportSourceDto } from '../../imports/sources/import-sources.dto';

@ApiTags('Exports')
@Controller({ path: 'exports/sources', version: '1' })
export class ExportSourcesController {
  constructor(private readonly exportSourcesService: ExportSourcesService) {}

  @Get()
  @ApiOkResponse({
    type: [ImportSourceDto],
    description: 'Get all available export destinations as a raw array',
  })
  async listAll(): Promise<ImportSourceDto[]> {
    return this.exportSourcesService.listAll();
  }
}
