import { Module } from '@nestjs/common';
import { FeedPersonsModule } from './persons/feed-persons.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [
    FeedPersonsModule,
  ],
  controllers: [FeedController],
  providers: [FeedService],
  exports: [FeedService],
})
export class FeedModule {}
