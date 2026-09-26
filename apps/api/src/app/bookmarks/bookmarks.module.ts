import { Module } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksTool } from './bookmarks.tool';

@Module({
  providers: [BookmarksService],
  controllers: [BookmarksController, BookmarksTool],
  exports: [BookmarksService],
})
export class BookmarksModule {}
