import { Module } from '@nestjs/common';
import { MovieLogsService } from './movie-logs.service';
import { MovieLogsController } from './movie-logs.controller';
import { MovieWatchedDatesModule } from './watched-dates/movie-watched-dates.module';
import { RecosModule } from '../../recos/recos.module';
import { SharedWorkerModule } from '@shared/worker';

@Module({
  imports: [
    SharedWorkerModule,
    RecosModule,
    MovieWatchedDatesModule,
  ],
  controllers: [MovieLogsController],
  providers: [MovieLogsService],
  exports: [MovieLogsService],
})
export class MovieLogsModule {}