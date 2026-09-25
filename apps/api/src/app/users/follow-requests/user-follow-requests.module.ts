import { Module } from '@nestjs/common';
import { UserFollowRequestsController } from './user-follow-requests.controller';
import { UserFollowRequestsTool } from './user-follow-requests.tool';
import { UserFollowRequestsService } from './user-follow-requests.service';

@Module({
  controllers: [UserFollowRequestsController, UserFollowRequestsTool],
  providers: [UserFollowRequestsService],
  exports: [UserFollowRequestsService],
})
export class UserFollowRequestsModule {}
