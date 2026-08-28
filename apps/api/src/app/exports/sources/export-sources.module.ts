import { Module } from '@nestjs/common';
import { ExportSourcesController } from './export-sources.controller';
import { ExportSourcesService } from './export-sources.service';

@Module({
  controllers: [ExportSourcesController],
  providers: [ExportSourcesService],
})
export class ExportSourcesModule {}
