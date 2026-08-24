import { Global, Module } from '@nestjs/common';
import { PrefectService } from './prefect.service';

@Global()
@Module({
  providers: [PrefectService],
  exports: [PrefectService],
})
export class PrefectModule {}
