import { forwardRef, Module } from '@nestjs/common';
import { MeAvatarController } from './me-avatar.controller';
import { MeAvatarService } from './me-avatar.service';
import { StorageModule } from '../../../common/modules/storage/storage.module';
import { MeModule } from '../me.module';

@Module({
  imports: [
    StorageModule,
    forwardRef(() => MeModule),
  ],
  controllers: [MeAvatarController],
  providers: [MeAvatarService],
  exports: [MeAvatarService],
})
export class MeAvatarModule {}
