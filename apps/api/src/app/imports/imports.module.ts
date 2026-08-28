import { Module } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { TransfersStorageModule } from '../../common/modules/transfers-storage/transfers-storage.module';
import { PrefectModule } from '../../common/modules/prefect/prefect.module';
import { ImportLogMoviesModule } from './log-movies/import-log-movies.module';
import { ImportLogTvSeriesModule } from './log-tv-series/import-log-tv-series.module';
import { ImportBookmarksModule } from './bookmarks/import-bookmarks.module';
import { ImportPlaylistsModule } from './playlists/import-playlists.module';
import { TvLogsSyncModule } from '../tv-series/logs/sync/tv-logs-sync.module';
import { ImportSourcesModule } from './sources/import-sources.module';

@Module({
  imports: [
    TransfersStorageModule,
    PrefectModule,
    ImportSourcesModule,
    ImportLogMoviesModule,
    ImportLogTvSeriesModule,
    ImportBookmarksModule,
    ImportPlaylistsModule,
    TvLogsSyncModule,
  ],
  providers: [ImportsService],
  controllers: [ImportsController],
  exports: [ImportsService],
})
export class ImportsModule {}
