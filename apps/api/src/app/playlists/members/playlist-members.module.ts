import { Module } from '@nestjs/common';
import { PlaylistMembersController } from './playlist-members.controller';
import { PlaylistMembersTool } from './playlist-members.tool';
import { PlaylistMembersService } from './playlist-members.service';
import { SharedWorkerModule } from '@shared/worker';

@Module({
  imports: [SharedWorkerModule],
  controllers: [PlaylistMembersController, PlaylistMembersTool],
  providers: [PlaylistMembersService],
  exports: [PlaylistMembersService],
})
export class PlaylistMembersModule {}
