import { Body, Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ImportsService } from '../../imports/imports.service';
import { ImportJobInternalEventDto } from '../../imports/dto/imports.dto';
import { InternalImportsGuard } from './internal-imports.guard';

// Called by the Prefect flow (db-sync/import_transfer), never by end users — see InternalImportsGuard.
@ApiExcludeController()
@Controller({ path: 'internal/imports', version: '1' })
export class InternalImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post(':id/events')
  @UseGuards(InternalImportsGuard)
  async recordEvent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ImportJobInternalEventDto,
  ): Promise<void> {
    return this.importsService.recordEvent(id, dto);
  }
}
