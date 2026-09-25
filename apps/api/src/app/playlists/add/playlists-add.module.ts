import { forwardRef, Module } from '@nestjs/common';
import { PlaylistsAddController } from './playlists-add.controller';
import { PlaylistsAddTool } from './playlists-add.tool';
import { PlaylistsAddService } from './playlists-add.service';
import { PlaylistsAddTargetsModule } from './targets/playlists-add-targets.module';
import { PlaylistsModule } from '../playlists.module';

@Module({
  imports: [PlaylistsAddTargetsModule, forwardRef(() => PlaylistsModule)],
  controllers: [PlaylistsAddController, PlaylistsAddTool],
  providers: [PlaylistsAddService],
  exports: [PlaylistsAddService],
})
export class PlaylistsAddModule {}
