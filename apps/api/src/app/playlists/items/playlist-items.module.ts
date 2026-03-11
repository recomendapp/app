import { Module } from '@nestjs/common';
import { PlaylistItemsController } from './playlist-items.controller';
import { PlaylistItemsService } from './playlist-items.service';
import { SharedWorkerModule } from '@shared/worker';

@Module({
  imports: [
    SharedWorkerModule,
  ],
  controllers: [PlaylistItemsController],
  providers: [PlaylistItemsService],
  exports: [PlaylistItemsService],
})
export class PlaylistItemsModule {}