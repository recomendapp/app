import { Module } from '@nestjs/common';
import { PersonsController } from './persons.controller';
import { PersonsService } from './persons.service';
import { PersonMoviesModule } from './movies/person-movies.module';
import { PersonTvSeriesModule } from './tv-series/person-tv-series.module';

@Module({
    imports: [
      PersonMoviesModule,
      PersonTvSeriesModule,
  ],
  controllers: [PersonsController],
  providers: [PersonsService],
  exports: [PersonsService],
})
export class PersonsModule {}
