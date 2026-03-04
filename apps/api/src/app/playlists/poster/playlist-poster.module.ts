import { Module } from '@nestjs/common';
import { PLaylistPosterController } from './playlist-poster.controller';
import { PLaylistPosterService } from './playlist-poster.service';
import { StorageModule } from '../../../common/modules/storage/storage.module';

@Module({
  imports: [
    StorageModule,
  ],
  controllers: [PLaylistPosterController],
  providers: [PLaylistPosterService],
  exports: [PLaylistPosterService],
})
export class PLaylistPosterModule {}
