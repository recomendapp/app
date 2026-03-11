import { Module } from '@nestjs/common';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { PlaylistLikesModule } from './likes/playlist-likes.module';
import { PlaylistSavesModule } from './saves/playlist-saves.module';
import { PlaylistPosterModule } from './poster/playlist-poster.module';
import { StorageModule } from '../../common/modules/storage/storage.module';
import { PlaylistMembersModule } from './members/playlist-members.module';
import { PlaylistsAddModule } from './add/playlists-add.module';
import { PlaylistItemsModule } from './items/playlist-items.module';


@Module({
  imports: [
    StorageModule,
    PlaylistLikesModule,
    PlaylistSavesModule,
    PlaylistPosterModule,
    PlaylistMembersModule,
    PlaylistsAddModule,
    PlaylistItemsModule,
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}