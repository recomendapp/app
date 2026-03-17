import { Module } from '@nestjs/common';
import { TvLogsSyncService } from './tv-logs-sync.service';
import { RecosModule } from '../../../recos/recos.module';

@Module({
  imports: [
    RecosModule,
  ],
  providers: [TvLogsSyncService],
  exports: [TvLogsSyncService],
})
export class TvLogsSyncModule {}