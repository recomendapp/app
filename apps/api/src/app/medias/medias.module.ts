import { Module } from '@nestjs/common';
import { MediasMostPopularModule } from './most-popular/medias-most-popular.module';

@Module({
  imports: [
    MediasMostPopularModule,
  ],
})
export class MediasModule {}