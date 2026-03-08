import { Module } from '@nestjs/common';
import { FeedPersonsModule } from './persons/feed-persons.module';

@Module({
  imports: [
    FeedPersonsModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class FeedModule {}
