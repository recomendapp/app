import { Module } from '@nestjs/common';
import { TvSeriesImagesService } from './tv-series-images.service';
import { TvSeriesImagesController } from './tv-series-images.controller';

@Module({
  controllers: [TvSeriesImagesController],
  providers: [TvSeriesImagesService],
  exports: [TvSeriesImagesService],
})
export class TvSeriesImagesModule {}