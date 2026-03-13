import { forwardRef, Module } from '@nestjs/common';
import { PlaylistItemsController } from './playlist-items.controller';
import { PlaylistItemsService } from './playlist-items.service';
import { SharedWorkerModule } from '@shared/worker';
import { PlaylistsModule } from '../playlists.module';

@Module({
  imports: [
    SharedWorkerModule,
    forwardRef(() => PlaylistsModule),
  ],
  controllers: [PlaylistItemsController],
  providers: [PlaylistItemsService],
  exports: [PlaylistItemsService],
})
export class PlaylistItemsModule {}