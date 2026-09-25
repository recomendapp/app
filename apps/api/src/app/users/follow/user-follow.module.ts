import { Module } from '@nestjs/common';
import { UserFollowController } from './user-follow.controller';
import { UserFollowTool } from './user-follow.tool';
import { UserFollowService } from './user-follow.service';
import { NotifySharedModule } from '@shared/notify';

@Module({
  imports: [NotifySharedModule],
  controllers: [UserFollowController, UserFollowTool],
  providers: [UserFollowService],
  exports: [UserFollowService],
})
export class UserFollowModule {}
