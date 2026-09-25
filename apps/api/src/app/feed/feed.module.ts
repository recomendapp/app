import { Module } from '@nestjs/common';
import { FeedPersonsModule } from './persons/feed-persons.module';
import { FeedController } from './feed.controller';
import { FeedTool } from './feed.tool';
import { FeedService } from './feed.service';

@Module({
  imports: [FeedPersonsModule],
  controllers: [FeedController, FeedTool],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
