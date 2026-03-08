import { Module } from '@nestjs/common';
import { PlaylistMembersController } from './playlist-members.controller';
import { PlaylistMembersService } from './playlist-members.service';

@Module({
  imports: [
  ],
  controllers: [PlaylistMembersController],
  providers: [PlaylistMembersService],
  exports: [PlaylistMembersService],
})
export class PlaylistMembersModule {}