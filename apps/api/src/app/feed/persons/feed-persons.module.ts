import { Module } from '@nestjs/common';
import { FeedPersonsController } from './feed-persons.controller';
import { FeedPersonsService } from './feed-persons.service';

@Module({
  controllers: [FeedPersonsController],
  providers: [FeedPersonsService],
  exports: [FeedPersonsService],
})
export class FeedPersonsModule {}
