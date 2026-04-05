import { Module } from '@nestjs/common';
import { MediasMostPopularService } from './medias-most-popular.service';
import { MediasMostPopularController } from './medias-most-popular.controller';

@Module({
  providers: [MediasMostPopularService],
  controllers: [MediasMostPopularController],
  exports: [MediasMostPopularService],
})
export class MediasMostPopularModule {}