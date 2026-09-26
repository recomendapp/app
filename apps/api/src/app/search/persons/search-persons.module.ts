import { Module } from '@nestjs/common';
import { SearchPersonsController } from './search-persons.controller';
import { SearchPersonsService } from './search-persons.service';
import { SearchPersonsTool } from './search-persons.tool';

@Module({
  controllers: [SearchPersonsController, SearchPersonsTool],
  providers: [SearchPersonsService],
  exports: [SearchPersonsService],
})
export class SearchPersonsModule {}
