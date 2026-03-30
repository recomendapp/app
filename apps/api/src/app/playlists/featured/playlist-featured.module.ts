import { Module } from '@nestjs/common';
import { PlaylistFeaturedController } from './playlist-featured.controller';
import { PlaylistFeaturedService } from './playlist-featured.service';

@Module({
  controllers: [PlaylistFeaturedController],
  providers: [PlaylistFeaturedService],
  exports: [PlaylistFeaturedService],
})
export class PlaylistFeaturedModule {}