import { Module } from '@nestjs/common';
import { MoviesLogModule } from './v1/log/movies-log.module';

@Module({
  imports: [
    MoviesLogModule
  ],
})
export class MoviesModule {}
