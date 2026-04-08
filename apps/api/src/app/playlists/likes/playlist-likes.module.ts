import { Module } from '@nestjs/common';
import { PlaylistLikesController } from './playlist-likes.controller';
import { PlaylistLikesService } from './playlist-likes.service';


@Module({
  controllers: [PlaylistLikesController],
  providers: [PlaylistLikesService],
  exports: [PlaylistLikesService],
})
export class PlaylistLikesModule {}