import { Module } from '@nestjs/common';
import { MoviesLogModule } from './log/movies-log.module';

@Module({
  imports: [
    MoviesLogModule
  ],
})
export class MoviesModule {}
