import { Module } from '@nestjs/common';
import { UserFollowersService } from './user-followers.service';
import { UserFollowersController } from './user-followers.controller';

@Module({
  controllers: [UserFollowersController],
  providers: [UserFollowersService],
  exports: [UserFollowersService],
})
export class UserFollowersModule {}