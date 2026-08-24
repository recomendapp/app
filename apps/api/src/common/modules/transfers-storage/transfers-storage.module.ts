import { Global, Module } from '@nestjs/common';
import { TransfersStorageService } from './transfers-storage.service';

@Global()
@Module({
  providers: [TransfersStorageService],
  exports: [TransfersStorageService],
})
export class TransfersStorageModule {}
