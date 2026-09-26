import { Module } from '@nestjs/common';
import { UserFollowingService } from './user-following.service';
import { UserFollowingController } from './user-following.controller';
import { UserFollowingTool } from './user-following.tool';

@Module({
  controllers: [UserFollowingController, UserFollowingTool],
  providers: [UserFollowingService],
  exports: [UserFollowingService],
})
export class UserFollowingModule {}
