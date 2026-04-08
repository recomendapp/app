import { forwardRef, Module } from '@nestjs/common';
import { PlaylistsAddController } from './playlists-add.controller';
import { PlaylistsAddService } from './playlists-add.service';
import { PlaylistsAddTargetsModule } from './targets/playlists-add-targets.module';
import { PlaylistsModule } from '../playlists.module';

@Module({
  imports: [
    PlaylistsAddTargetsModule,
    forwardRef(() => PlaylistsModule),
  ],
  controllers: [PlaylistsAddController],
  providers: [PlaylistsAddService],
  exports: [PlaylistsAddService],
})
export class PlaylistsAddModule {}