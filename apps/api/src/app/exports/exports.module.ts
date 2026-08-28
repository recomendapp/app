import { Module } from '@nestjs/common';
import { ExportSourcesModule } from './sources/export-sources.module';

@Module({
  imports: [ExportSourcesModule],
})
export class ExportsModule {}
