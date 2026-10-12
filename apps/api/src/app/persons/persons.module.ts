import { Module } from '@nestjs/common';
import { PersonMetadataModule } from './metadata/person-metadata.module';
import { PersonsController } from './persons.controller';
import { PersonsTool } from './persons.tool';
import { PersonsService } from './persons.service';
import { PersonMoviesModule } from './movies/person-movies.module';
import { PersonTvSeriesModule } from './tv-series/person-tv-series.module';

@Module({
  imports: [PersonMoviesModule, PersonTvSeriesModule, PersonMetadataModule],
  controllers: [PersonsController, PersonsTool],
  providers: [PersonsService],
  exports: [PersonsService],
})
export class PersonsModule {}
