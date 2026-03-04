import { Module } from '@nestjs/common';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { PlaylistLikesModule } from './likes/playlist-likes.module';
import { PlaylistSavesModule } from './saves/playlist-saves.module';
import { PLaylistPosterModule } from './poster/playlist-poster.module';
import { StorageModule } from '../../common/modules/storage/storage.module';


@Module({
  imports: [
    StorageModule,
    PlaylistLikesModule,
    PlaylistSavesModule,
    PLaylistPosterModule,
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}