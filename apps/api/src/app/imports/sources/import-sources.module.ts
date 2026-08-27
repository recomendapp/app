import { Module } from '@nestjs/common';
import { ImportSourcesController } from './import-sources.controller';
import { ImportSourcesService } from './import-sources.service';

@Module({
  controllers: [ImportSourcesController],
  providers: [ImportSourcesService],
})
export class ImportSourcesModule {}
