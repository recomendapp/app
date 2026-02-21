import { Module } from '@nestjs/common';
import { UserBookmarksService } from './user-bookmarks.service';
import { UserBookmarksController } from './user-bookmarks.controller';

@Module({
  controllers: [UserBookmarksController],
  providers: [UserBookmarksService],
  exports: [UserBookmarksService],
})
export class UserBookmarksModule {}