import { Module } from '@nestjs/common';
import { PlaylistPosterController } from './playlist-poster.controller';
import { PlaylistPosterService } from './playlist-poster.service';
import { StorageModule } from '../../../common/modules/storage/storage.module';

@Module({
  imports: [
    StorageModule,
  ],
  controllers: [PlaylistPosterController],
  providers: [PlaylistPosterService],
  exports: [PlaylistPosterService],
})
export class PlaylistPosterModule {}
