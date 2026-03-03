import { Module } from '@nestjs/common';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { PlaylistLikesModule } from './likes/playlist-likes.module';
import { PlaylistSavesModule } from './saves/playlist-saves.module';


@Module({
  imports: [
    PlaylistLikesModule,
    PlaylistSavesModule,
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}