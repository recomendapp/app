import { Module } from '@nestjs/common';
import { PlaylistLikesController } from './playlist-likes.controller';
import { PlaylistLikesService } from './playlist-likes.service';
import { SharedWorkerModule } from '@shared/worker';


@Module({
  imports: [
    SharedWorkerModule,
  ],
  controllers: [PlaylistLikesController],
  providers: [PlaylistLikesService],
  exports: [PlaylistLikesService],
})
export class PlaylistLikesModule {}