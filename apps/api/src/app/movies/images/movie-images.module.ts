import { Module } from '@nestjs/common';
import { MovieImagesService } from './movie-images.service';
import { MovieImagesController } from './movie-images.controller';

@Module({
  controllers: [MovieImagesController],
  providers: [MovieImagesService],
  exports: [MovieImagesService],
})
export class MovieImagesModule {}