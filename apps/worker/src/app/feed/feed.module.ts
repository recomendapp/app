import { Module } from '@nestjs/common';
import { FeedProcessor } from './feed.processor';
import { FeedService } from './feed.service';

@Module({
	providers: [FeedProcessor, FeedService],
})
export class FeedModule {}