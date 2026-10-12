import { Module } from '@nestjs/common';
import { TvSeriesMetadataService } from './tv-series-metadata.service';
import { TvSeriesMetadataController } from './tv-series-metadata.controller';

@Module({
  controllers: [TvSeriesMetadataController],
  providers: [TvSeriesMetadataService],
  exports: [TvSeriesMetadataService],
})
export class TvSeriesMetadataModule {}
