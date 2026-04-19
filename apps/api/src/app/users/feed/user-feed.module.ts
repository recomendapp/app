import { Module } from '@nestjs/common';
import { UserFeedController } from './user-feed.controller';
import { FeedModule } from '../../feed/feed.module';

@Module({
  imports: [FeedModule],
  controllers: [UserFeedController],
})
export class UserFeedModule {}