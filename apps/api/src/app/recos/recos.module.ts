import { Module } from '@nestjs/common';
import { RecosService } from './recos.service';
import { RecosController } from './recos.controller';
import { RecoTargetsModule } from './targets/reco-targets.module';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [
    NotifySharedModule,
    RecoTargetsModule,
  ],
  providers: [RecosService],
  controllers: [RecosController],
  exports: [RecosService],
})
export class RecosModule {}