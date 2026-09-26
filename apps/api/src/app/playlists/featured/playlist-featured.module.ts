import { Module } from '@nestjs/common';
import { PlaylistFeaturedController } from './playlist-featured.controller';
import { PlaylistFeaturedTool } from './playlist-featured.tool';
import { PlaylistFeaturedService } from './playlist-featured.service';

@Module({
  controllers: [PlaylistFeaturedController, PlaylistFeaturedTool],
  providers: [PlaylistFeaturedService],
  exports: [PlaylistFeaturedService],
})
export class PlaylistFeaturedModule {}
