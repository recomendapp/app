import { Module } from '@nestjs/common';
import { UserFollowersService } from './user-followers.service';
import { UserFollowersController } from './user-followers.controller';
import { UserFollowersTool } from './user-followers.tool';

@Module({
  controllers: [UserFollowersController, UserFollowersTool],
  providers: [UserFollowersService],
  exports: [UserFollowersService],
})
export class UserFollowersModule {}
