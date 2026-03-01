import { Module } from '@nestjs/common';
import { UserFollowRequestsController } from './user-follow-requests.controller';
import { UserFollowRequestsService } from './user-follow-requests.service';

@Module({
  controllers: [UserFollowRequestsController],
  providers: [UserFollowRequestsService],
  exports: [UserFollowRequestsService],
})
export class UserFollowRequestsModule {}
