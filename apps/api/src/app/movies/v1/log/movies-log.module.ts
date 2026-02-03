import { Module } from '@nestjs/common';
import { MoviesLogService } from './movies-log.service';
import { MoviesLogController } from './movies-log.controller';

@Module({
  controllers: [MoviesLogController],
  providers: [MoviesLogService],
  exports: [MoviesLogService],
})
export class MoviesLogModule {}