import { Module } from '@nestjs/common';
import { PlaylistSavesController } from './playlist-saves.controller';
import { PlaylistSavesService } from './playlist-saves.service';
import { SharedWorkerModule } from '@shared/worker';


@Module({
  imports: [
    SharedWorkerModule,
  ],
  controllers: [PlaylistSavesController],
  providers: [PlaylistSavesService],
  exports: [PlaylistSavesService],
})
export class PlaylistSavesModule {}