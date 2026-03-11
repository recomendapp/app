import { Module } from '@nestjs/common';
import { PlaylistsAddController } from './playlists-add.controller';
import { PlaylistsAddService } from './playlists-add.service';
import { SharedWorkerModule } from '@shared/worker';
import { PlaylistsAddTargetsModule } from './targets/playlists-add-targets.module';

@Module({
  imports: [
    SharedWorkerModule,
    PlaylistsAddTargetsModule,
  ],
  controllers: [PlaylistsAddController],
  providers: [PlaylistsAddService],
  exports: [PlaylistsAddService],
})
export class PlaylistsAddModule {}