import { Module } from '@nestjs/common';
import { FeedPersonsController } from './feed-persons.controller';
import { FeedPersonsTool } from './feed-persons.tool';
import { FeedPersonsService } from './feed-persons.service';

@Module({
  controllers: [FeedPersonsController, FeedPersonsTool],
  providers: [FeedPersonsService],
  exports: [FeedPersonsService],
})
export class FeedPersonsModule {}
