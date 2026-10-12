import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PersonMetadataService } from './person-metadata.service';
import { PersonMetadataDto } from './person-metadata.dto';

@ApiTags('Persons')
@Controller({
  path: 'person/:person_id',
  version: '1',
})
export class PersonMetadataController {
  constructor(private readonly personMetadataService: PersonMetadataService) {}

  @Get('metadata')
  @ApiOkResponse({
    description: 'Locales that genuinely translate this person, for the page hreflang set',
    type: PersonMetadataDto,
  })
  async get(@Param('person_id', ParseIntPipe) personId: number): Promise<PersonMetadataDto> {
    return this.personMetadataService.get(personId);
  }
}
