import { Module } from '@nestjs/common';
import { MovieMetadataService } from './movie-metadata.service';
import { MovieMetadataController } from './movie-metadata.controller';

@Module({
  controllers: [MovieMetadataController],
  providers: [MovieMetadataService],
  exports: [MovieMetadataService],
})
export class MovieMetadataModule {}
