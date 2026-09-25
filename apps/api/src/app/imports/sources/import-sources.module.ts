import { Module } from '@nestjs/common';
import { ImportSourcesController } from './import-sources.controller';
import { ImportSourcesTool } from './import-sources.tool';
import { ImportSourcesService } from './import-sources.service';

@Module({
  controllers: [ImportSourcesController, ImportSourcesTool],
  providers: [ImportSourcesService],
})
export class ImportSourcesModule {}
