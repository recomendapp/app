import { Module } from '@nestjs/common';
import { RecosService } from './recos.service';
import { RecosController } from './recos.controller';
import { RecoTargetsModule } from './targets/reco-targets.module';
import { NotifySharedModule } from '@shared/notify';
import { RecosTrendingModule } from './trending/recos-trending.module';
import { UserRecosModule } from '../users/recos/user-recos.module';

@Module({
  imports: [NotifySharedModule, RecoTargetsModule, RecosTrendingModule, UserRecosModule],
  providers: [RecosService],
  controllers: [RecosController],
  exports: [RecosService],
})
export class RecosModule {}
