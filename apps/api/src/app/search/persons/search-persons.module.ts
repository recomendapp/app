import { Module } from '@nestjs/common';
import { SearchPersonsController } from './search-persons.controller';
import { SearchPersonsService } from './search-persons.service';

@Module({
  controllers: [SearchPersonsController],
  providers: [SearchPersonsService],
  exports: [SearchPersonsService],
})
export class SearchPersonsModule {}
