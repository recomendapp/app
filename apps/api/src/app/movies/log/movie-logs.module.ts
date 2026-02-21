import { Module } from '@nestjs/common';
import { MovieLogsService } from './movie-logs.service';
import { MovieLogsController } from './movie-logs.controller';

@Module({
  controllers: [MovieLogsController],
  providers: [MovieLogsService],
  exports: [MovieLogsService],
})
export class MovieLogsModule {}