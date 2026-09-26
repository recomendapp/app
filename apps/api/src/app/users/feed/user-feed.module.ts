import { Module } from '@nestjs/common';
import { UserFeedController } from './user-feed.controller';
import { UserFeedTool } from './user-feed.tool';
import { FeedModule } from '../../feed/feed.module';

@Module({
  imports: [FeedModule],
  controllers: [UserFeedController, UserFeedTool],
})
export class UserFeedModule {}
