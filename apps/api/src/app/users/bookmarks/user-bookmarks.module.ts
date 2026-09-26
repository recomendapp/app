import { Module } from '@nestjs/common';
import { UserBookmarksService } from './user-bookmarks.service';
import { UserBookmarksController } from './user-bookmarks.controller';
import { UserBookmarksTool } from './user-bookmarks.tool';

@Module({
  controllers: [UserBookmarksController, UserBookmarksTool],
  providers: [UserBookmarksService],
  exports: [UserBookmarksService],
})
export class UserBookmarksModule {}
