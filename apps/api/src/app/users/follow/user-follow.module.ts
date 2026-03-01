import { Module } from '@nestjs/common';
import { UserFollowController } from './user-follow.controller';
import { UserFollowService } from './user-follow.service';
import { NotifySharedModule } from '@shared/notify';
import { SharedWorkerModule } from '@shared/worker';

@Module({
  imports: [
    SharedWorkerModule,
    NotifySharedModule,
  ],
  controllers: [UserFollowController],
  providers: [UserFollowService],
  exports: [UserFollowService],
})
export class UserFollowModule {}
