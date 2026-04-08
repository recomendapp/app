import { Module } from '@nestjs/common';
import { UserFollowController } from './user-follow.controller';
import { UserFollowService } from './user-follow.service';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [
    NotifySharedModule,
  ],
  controllers: [UserFollowController],
  providers: [UserFollowService],
  exports: [UserFollowService],
})
export class UserFollowModule {}
