import { Module } from '@nestjs/common';
import { ImportBookmarksController } from './import-bookmarks.controller';
import { ImportBookmarksTool } from './import-bookmarks.tool';
import { ImportBookmarksService } from './import-bookmarks.service';

@Module({
  controllers: [ImportBookmarksController, ImportBookmarksTool],
  providers: [ImportBookmarksService],
})
export class ImportBookmarksModule {}
