import { Module } from '@nestjs/common';
import { PlaylistLikesController } from './playlist-likes.controller';
import { PlaylistLikesTool } from './playlist-likes.tool';
import { PlaylistLikesService } from './playlist-likes.service';

@Module({
  controllers: [PlaylistLikesController, PlaylistLikesTool],
  providers: [PlaylistLikesService],
  exports: [PlaylistLikesService],
})
export class PlaylistLikesModule {}
