import { Module } from '@nestjs/common';
import { ImportBookmarksController } from './import-bookmarks.controller';
import { ImportBookmarksService } from './import-bookmarks.service';

@Module({
  controllers: [ImportBookmarksController],
  providers: [ImportBookmarksService],
})
export class ImportBookmarksModule {}
